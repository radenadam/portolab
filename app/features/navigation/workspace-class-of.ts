import type { ClassId } from "~/features/classes/classes.schema";

/** The class of the workspace of a person, as decision 0030 chooses it: the class of the address when the person belongs to it, else the class that the person opened last when the person still belongs to it, else the class that the person joined or created last. The classes come in the order in which the person joined or created them. */
export function workspaceClassOf<Class extends { id: ClassId }>(
  classes: readonly Class[],
  {
    addressed,
    lastOpened,
  }: { addressed: ClassId | undefined; lastOpened: ClassId | undefined },
): Class | undefined {
  for (const preferred of [addressed, lastOpened]) {
    const found = classes.find((candidate) => candidate.id === preferred);
    if (found !== undefined) {
      return found;
    }
  }
  return classes.at(-1);
}
