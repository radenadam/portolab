export function classActivity(
  students: readonly { ordersThisWeek: number }[],
): { active: number; ordersThisWeek: number } {
  let active = 0;
  let ordersThisWeek = 0;
  for (const student of students) {
    if (student.ordersThisWeek > 0) active += 1;
    ordersThisWeek += student.ordersThisWeek;
  }
  return { active, ordersThisWeek };
}
