/** Callers build a complete matrix, so a missing cell is a defect. */
export function matrixCell<Cell>(
  matrix: readonly (readonly Cell[])[],
  rowIndex: number,
  columnIndex: number,
): Cell {
  const cell = matrix[rowIndex]?.[columnIndex];
  if (cell === undefined) {
    throw new Error(
      `The matrix has no cell in row ${String(rowIndex + 1)} and column ${String(columnIndex + 1)}.`,
    );
  }
  return cell;
}
