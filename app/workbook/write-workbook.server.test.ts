import { expect, test } from "vitest";
import { readZipForTest } from "./read-zip-for-test.server";
import { workbookMediaType, writeWorkbook } from "./write-workbook.server";
import type { Worksheet } from "./write-workbook.server";

const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/** The parts of the package of a workbook, by path, as text. */
function readParts(sheet: Worksheet): Map<string, string> {
  const decoder = new TextDecoder();
  const parts = new Map<string, string>();
  for (const [path, content] of readZipForTest(writeWorkbook(sheet))) {
    parts.set(path, decoder.decode(content));
  }
  return parts;
}

const sheet: Worksheet = {
  name: 'Portofolio & "kelas"',
  columnWidths: [30, 16],
  rows: [
    [{ kind: "text", text: "Portofolio", style: "heading" }],
    [],
    [
      { kind: "text", text: "Siti", style: "plain" },
      { kind: "number", value: -0.0038, format: "percent" },
    ],
    [
      undefined,
      { kind: "number", value: 1_003_259_000_000, format: "wholeNumber" },
    ],
    [{ kind: "number", value: 0.62, format: "twoDecimals" }],
  ],
};

test("writes the parts that a workbook of Office Open XML needs, with the content type of each", () => {
  const parts = readParts(sheet);
  expect([...parts.keys()]).toEqual([
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
  ]);
  expect(parts.get("[Content_Types].xml")).toBe(
    `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  );
  expect(parts.get("_rels/.rels")).toBe(
    `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );
  expect(parts.get("xl/_rels/workbook.xml.rels")).toBe(
    `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );
  expect(workbookMediaType).toBe(
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
});

test("names the worksheet with the characters that XML escapes in an attribute", () => {
  expect(readParts(sheet).get("xl/workbook.xml")).toBe(
    `${declaration}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Portofolio &amp; &quot;kelas&quot;" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  );
});

// Styles 2, 3, and 4 apply the built-in number formats 3, 10, and 2 of ECMA-376, which are #,##0, 0.00%, and 0.00, and style 1 applies the bold font.
test("writes each column width, each text as text, each number with the style of its format, and no cell where a row leaves one empty", () => {
  expect(readParts(sheet).get("xl/worksheets/sheet1.xml")).toBe(
    `${declaration}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="2" width="16" customWidth="1"/></cols><sheetData><row r="1"><c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">Portofolio</t></is></c></row><row r="2"></row><row r="3"><c r="A3" t="inlineStr"><is><t xml:space="preserve">Siti</t></is></c><c r="B3" s="3"><v>-0.0038</v></c></row><row r="4"><c r="B4" s="2"><v>1003259000000</v></c></row><row r="5"><c r="A5" s="4"><v>0.62</v></c></row></sheetData></worksheet>`,
  );
  expect(readParts(sheet).get("xl/styles.xml")).toContain(
    '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>',
  );
});

test("names the 27th column AA, after Z", () => {
  const wide: Worksheet = {
    name: "Lebar",
    columnWidths: [],
    rows: [
      [...Array(27).keys()].map((index) => ({
        kind: "number" as const,
        value: index,
        format: "wholeNumber" as const,
      })),
    ],
  };
  const xml = readParts(wide).get("xl/worksheets/sheet1.xml");
  expect(xml).toContain('<c r="Z1" s="2"><v>25</v></c>');
  expect(xml).toContain('<c r="AA1" s="2"><v>26</v></c>');
});

// A name of a person keeps every character that its owner typed but a run of spaces, so a text cell must hold the characters that XML escapes, the control characters that XML cannot hold, and a text that looks like the escape of ECMA-376 for them.
test("escapes the characters that XML cannot hold as they are, so a spreadsheet shows the text as it was typed", () => {
  const typed: Worksheet = {
    name: "Teks",
    columnWidths: [],
    rows: [
      [
        {
          kind: "text",
          text: 'A & B <C> "D"\u0001E\u001fF\uFFFFG_x0041_H\tI',
          style: "plain",
        },
      ],
    ],
  };
  expect(readParts(typed).get("xl/worksheets/sheet1.xml")).toContain(
    '<t xml:space="preserve">A &amp; B &lt;C&gt; &quot;D&quot;_x0001_E_x001F_F_xFFFF_G_x005F_x0041_H\tI</t>',
  );
});
