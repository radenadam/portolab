/** A form with the fields of a test, each a name and the text that the form sends in it. A field that the test leaves out is one that the form did not send. */
export function formDataForTest(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    form.set(name, value);
  }
  return form;
}
