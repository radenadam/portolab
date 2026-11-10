/** The markup of a table of measures, with the label of each column and the name and the cells of each row, as MeasureTable shows it without the classes of its styles. */
export function measureTableForTest(
  header: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const head = header.map((label) => `<th scope="col">${label}</th>`).join("");
  const body = rows
    .map(
      ([name, ...cells]) =>
        `<tr><th scope="row">${name ?? ""}</th>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
