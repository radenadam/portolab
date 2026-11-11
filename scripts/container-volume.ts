import { fail, failuresOf, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";
import { notAnObject, parseListField, parseStringAt } from "./json.ts";

/** Reads the id of the running container of Portolab, as `docker compose ps --quiet` prints it on a line of its own. */
export function parseContainerId(
  value: unknown,
  source: string,
): Result<string, string> {
  return typeof value === "string" && /^[0-9a-f]{12,64}\n$/.test(value)
    ? succeed(value.trimEnd())
    : fail(
        `${source} must be the id of one running container on a line of its own, but it is ${describeValue(value)}.`,
      );
}

/** The two folders in which a process of the server finds the files of the volume of the running container of Portolab. */
export interface VolumeFolders {
  /** The folder as the process of the container sees it, through /proc/<pid>/root, which Linux opens to every process with the user number of that process. */
  ofProcess: string;
  /** The folder of the volume on the server. */
  ofVolume: string;
}

interface Mount {
  source: string;
  destination: string;
}

/** Reads the folders of the volume of the running container of Portolab from the details that `docker inspect` prints as JSON. The container mounts only the volume of the database, so the details must name one mount. */
export function parseVolumeFolders(
  value: unknown,
  source: string,
): Result<VolumeFolders, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const state = value["State"];
  const processId = isRecord(state) ? state["Pid"] : undefined;
  if (
    typeof processId !== "number" ||
    !Number.isSafeInteger(processId) ||
    processId <= 0
  ) {
    return fail(
      `${source} must have the number of a running process at State.Pid, but State.Pid is ${describeValue(processId)}.`,
    );
  }
  const mounts = parseListField(value, source, {
    field: "Mounts",
    itemName: "mount",
    parseItem: parseMount,
  });
  if (!mounts.ok) {
    return mounts;
  }
  const [mount] = mounts.value;
  if (mount === undefined || mounts.value.length > 1) {
    return fail(
      `${source} must have one mount, the volume of the database, but it has ${String(mounts.value.length)}.`,
    );
  }
  return succeed({
    ofProcess: `/proc/${String(processId)}/root${mount.destination}`,
    ofVolume: mount.source,
  });
}

function parseMount(value: unknown, source: string): Result<Mount, string> {
  const mountSource = parseStringAt(value, source, ["Source"]);
  const destination = parseStringAt(value, source, ["Destination"]);
  if (!mountSource.ok || !destination.ok) {
    return fail(failuresOf([mountSource, destination]).join(" "));
  }
  return succeed({ source: mountSource.value, destination: destination.value });
}
