/** The phone project preserves touch input while desktop covers both reference widths. */
export function screenshotWidths(projectName: string): readonly number[] {
  return projectName === "phone" ? [360] : [1440, 1920];
}
