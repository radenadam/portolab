import { expect, test } from "vitest";
import { parseContainerId, parseVolumeFolders } from "./container-volume.ts";

const containerId =
  "3f6c2a9d81b04e7c5a2f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b";

const source = "The output of docker inspect";

/** The volume of the database as docker inspect describes it in Mounts. */
const databaseVolume = {
  Type: "volume",
  Name: "portolab_data",
  Source: "/var/lib/docker/volumes/portolab_data/_data",
  Destination: "/app/data",
  Driver: "local",
  Mode: "z",
  RW: true,
  Propagation: "",
};

/** The details of a running container as docker inspect prints them, with the fields that the parser does not read left out. */
function containerDetails(processId: unknown, mounts: unknown): unknown {
  return {
    Id: containerId,
    State: { Status: "running", Running: true, Pid: processId },
    Mounts: mounts,
  };
}

test("reads the id of the running container as docker compose ps prints it, in full or short", () => {
  for (const id of [containerId, containerId.slice(0, 12)]) {
    expect(parseContainerId(`${id}\n`, "The output of ps")).toEqual({
      ok: true,
      value: id,
    });
  }
});

test("rejects an output of docker compose ps without one running container on a line of its own", () => {
  for (const [output, description] of [
    ["", "empty"],
    [containerId, JSON.stringify(containerId)],
    [
      `${containerId}\n${containerId}\n`,
      JSON.stringify(`${containerId}\n${containerId}\n`),
    ],
    ["portolab-app-1\n", '"portolab-app-1\\n"'],
    [undefined, "missing"],
  ] as const) {
    expect(parseContainerId(output, "The output of ps")).toEqual({
      ok: false,
      failure: `The output of ps must be the id of one running container on a line of its own, but it is ${description}.`,
    });
  }
});

test("reads the folder of the volume through the process of the container and on the server", () => {
  expect(
    parseVolumeFolders(containerDetails(4242, [databaseVolume]), source),
  ).toEqual({
    ok: true,
    value: {
      ofProcess: "/proc/4242/root/app/data",
      ofVolume: "/var/lib/docker/volumes/portolab_data/_data",
    },
  });
});

test("rejects details without the number of a running process, such as those of a stopped container, whose process docker inspect gives as 0", () => {
  for (const [processId, description] of [
    [0, "0"],
    [undefined, "missing"],
    ["4242", '"4242"'],
    [42.5, "42.5"],
  ] as const) {
    expect(
      parseVolumeFolders(containerDetails(processId, [databaseVolume]), source),
    ).toEqual({
      ok: false,
      failure: `The output of docker inspect must have the number of a running process at State.Pid, but State.Pid is ${description}.`,
    });
  }
});

test("rejects the details of a container without exactly one mount, such as after compose.yaml gains a second volume, because the test would check another folder or none", () => {
  for (const [mounts, count] of [
    [[], 0],
    [[databaseVolume, { ...databaseVolume, Destination: "/app/cache" }], 2],
  ] as const) {
    expect(parseVolumeFolders(containerDetails(4242, mounts), source)).toEqual({
      ok: false,
      failure: `The output of docker inspect must have one mount, the volume of the database, but it has ${String(count)}.`,
    });
  }
});

test("rejects details whose mounts are not a list of mounts, naming each field that is wrong", () => {
  expect(parseVolumeFolders(containerDetails(4242, undefined), source)).toEqual(
    {
      ok: false,
      failure:
        "The output of docker inspect must have a list at Mounts, but Mounts is missing.",
    },
  );
  expect(
    parseVolumeFolders(
      containerDetails(4242, [{ Type: "volume", Destination: 7 }]),
      source,
    ),
  ).toEqual({
    ok: false,
    failure:
      "The output of docker inspect: mount 1 must have a string at Source, but Source is missing. The output of docker inspect: mount 1 must have a string at Destination, but Destination is 7.",
  });
});

test("rejects details that are not an object", () => {
  expect(parseVolumeFolders([containerDetails(4242, [])], source)).toEqual({
    ok: false,
    failure: `The output of docker inspect must be a JSON object, but it is ${JSON.stringify([containerDetails(4242, [])])}.`,
  });
});
