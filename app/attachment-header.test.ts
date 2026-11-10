import { expect, test } from "vitest";
import { attachmentHeader } from "./attachment-header";

// RFC 8187 allows letters, digits, and !#$&+-.^_`|~ in a value, and every other byte is a percent escape of the name in UTF-8: a space is %20, "'" is %27, "(" and ")" are %28 and %29, "*" is %2A, "/" is %2F, and é is %C3%A9.
test("writes a file name of any characters as the percent escapes of its bytes in UTF-8", () => {
  expect(attachmentHeader("Portofolio mahasiswa di Kelas A.xlsx")).toBe(
    "attachment; filename*=UTF-8''Portofolio%20mahasiswa%20di%20Kelas%20A.xlsx",
  );
  expect(attachmentHeader("Kelas (Pagi) 'B' * 1/2 é.xlsx")).toBe(
    "attachment; filename*=UTF-8''Kelas%20%28Pagi%29%20%27B%27%20%2A%201%2F2%20%C3%A9.xlsx",
  );
});
