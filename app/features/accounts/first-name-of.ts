export function firstNameOf(name: string): string {
  return name.split(/\s+/u).slice(0, 1).join("");
}
