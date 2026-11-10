import type { NumberFormat, WorkbookCell } from "./workbook-cells";
import { writeZip } from "./write-zip.server";

/** The one worksheet of a workbook: its name, the width of each column in characters, and its rows, in which undefined leaves a cell empty. */
export interface Worksheet {
  name: string;
  columnWidths: readonly number[];
  rows: readonly (readonly (WorkbookCell | undefined)[])[];
}

/** The media type of an Office Open XML workbook, which a response gives so that a browser saves it as a spreadsheet. */
export const workbookMediaType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Each style of a cell is an index into cellXfs of styles.xml, and a cell without one takes the first. The number formats are built into every spreadsheet, as the element numFmt of ECMA-376 lists them: 3 is #,##0, 10 is 0.00%, and 2 is 0.00.
const textStyles: Record<
  Extract<WorkbookCell, { kind: "text" }>["style"],
  string
> = {
  plain: "",
  heading: ' s="1"',
};
const numberStyles: Record<NumberFormat, number> = {
  wholeNumber: 2,
  percent: 3,
  twoDecimals: 4,
};

const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const spreadsheetNamespace =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const relationshipsNamespace =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const relationshipTypes =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const styles = `${declaration}<styleSheet xmlns="${spreadsheetNamespace}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

const contentTypes = `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

const packageRelationships = `${declaration}<Relationships xmlns="${relationshipsNamespace}"><Relationship Id="rId1" Type="${relationshipTypes}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const workbookRelationships = `${declaration}<Relationships xmlns="${relationshipsNamespace}"><Relationship Id="rId1" Type="${relationshipTypes}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${relationshipTypes}/styles" Target="styles.xml"/></Relationships>`;

/** Writes a workbook with one worksheet in the Office Open XML format of ECMA-376, which Excel, Google Sheets, and LibreOffice open. */
export function writeWorkbook(sheet: Worksheet): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const parts: Record<string, string> = {
    "[Content_Types].xml": contentTypes,
    "_rels/.rels": packageRelationships,
    "xl/workbook.xml": `${declaration}<workbook xmlns="${spreadsheetNamespace}" xmlns:r="${relationshipTypes}"><sheets><sheet name="${escapeXml(sheet.name)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": workbookRelationships,
    "xl/styles.xml": styles,
    "xl/worksheets/sheet1.xml": worksheetXml(sheet),
  };
  return writeZip(
    Object.entries(parts).map(([path, xml]) => ({
      path,
      content: encoder.encode(xml),
    })),
  );
}

function worksheetXml(sheet: Worksheet): string {
  const columns = sheet.columnWidths
    .map(
      (width, index) =>
        `<col min="${String(index + 1)}" max="${String(index + 1)}" width="${String(width)}" customWidth="1"/>`,
    )
    .join("");
  const rows = sheet.rows
    .map((cells, rowIndex) => {
      const reference = String(rowIndex + 1);
      const cellsXml = cells
        .map((cell, columnIndex) =>
          cell === undefined
            ? ""
            : cellXml(`${columnName(columnIndex)}${reference}`, cell),
        )
        .join("");
      return `<row r="${reference}">${cellsXml}</row>`;
    })
    .join("");
  return `${declaration}<worksheet xmlns="${spreadsheetNamespace}"><cols>${columns}</cols><sheetData>${rows}</sheetData></worksheet>`;
}

function cellXml(reference: string, cell: WorkbookCell): string {
  switch (cell.kind) {
    case "text":
      return `<c r="${reference}" t="inlineStr"${textStyles[cell.style]}><is><t xml:space="preserve">${escapeXml(cell.text)}</t></is></c>`;
    case "number":
      // A spreadsheet reads the value of a cell in the notation of XML Schema, whatever its language, and its format shows the value in the language of the reader.
      return `<c r="${reference}" s="${String(numberStyles[cell.format])}"><v>${String(cell.value)}</v></c>`;
  }
}

/** The name of a column, such as A for the first, Z for the 26th, and AA for the 27th. */
function columnName(index: number): string {
  let name = "";
  let remaining = index + 1;
  while (remaining > 0) {
    const letter = (remaining - 1) % 26;
    name = String.fromCharCode(65 + letter) + name;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return name;
}

// The characters that XML 1.0 holds only as an entity in a text or in a value of an attribute.
const entities = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
]);

/** Escapes a text for XML. XML 1.0 cannot hold most control characters and the noncharacters U+FFFE and U+FFFF, so the text writes each as _xHHHH_, the escape of the type ST_Xstring of ECMA-376, which a spreadsheet reads back as the character. A text that holds such an escape already writes its underscore as _x005F_, so the spreadsheet shows the text as it was typed. */
function escapeXml(text: string): string {
  let escaped = "";
  for (const character of text.replaceAll(
    /_(x[0-9A-Fa-f]{4}_)/g,
    "_x005F_$1",
  )) {
    escaped += isOutsideXml(character)
      ? `_x${character.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}_`
      : (entities.get(character) ?? character);
  }
  return escaped;
}

function isOutsideXml(character: string): boolean {
  const code = character.charCodeAt(0);
  // XML 1.0 holds the tab, the line feed, and the carriage return among the control characters.
  const isAllowedControl = code === 0x09 || code === 0x0a || code === 0x0d;
  return (
    (code < 0x20 && !isAllowedControl) || code === 0xfffe || code === 0xffff
  );
}
