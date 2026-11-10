# 0022. The lecturer downloads the portfolios as a workbook that Portolab writes

- Status: Accepted
- Date: 2026-11-11

## Context

The lecturer grades the portfolios of a class in a spreadsheet, as issue #10 asks. Lecturers in Indonesia use Excel and Google Sheets, in Bahasa Indonesia or in English, and the spreadsheet must read every number of the export as a number in the language of the lecturer, so that the lecturer can sort and compute with it.

A file of comma-separated values leaves both to the spreadsheet. Excel splits such a file at the list separator of the regional settings of the computer, which is a semicolon in Bahasa Indonesia, and it reads a decimal mark by the same settings, which need not match the language that the lecturer chose in Portolab. A spreadsheet also runs a value that starts with `=`, `+`, `-`, or `@` as a formula, so a student could name themselves with a formula that runs on the computer of the lecturer.

## Decision

- The export is a workbook of Office Open XML, the `.xlsx` format of ECMA-376, with one worksheet. It holds the title of the page of the portfolios, a notice that the values are a simulation at delayed prices with the time of the download and the delay of the source, a row of headings, and a row for each student in the order of decision 0021, with the reason of each portfolio without measures.
- Each number is a number in the workbook, without rounding, with a format that every spreadsheet builds in: whole rupiah with groups of digits, a percentage with two decimals, or a beta with two decimals. So each spreadsheet shows the numbers in its own language, and the texts are in the language of the lecturer in Portolab.
- Each text is an inline string of the worksheet, which a spreadsheet never runs as a formula.
- Portolab writes the workbook itself, in `app/workbook/`. It stores the files of the workbook in a zip archive without compression, with the CRC-32 of `node:zlib`.
- The file takes the title of the page of the portfolios as its name.

## Alternatives

- **Comma-separated values in the format of each language.** A semicolon and a decimal comma in Bahasa Indonesia would suit Excel on a computer with Indonesian settings, but not a lecturer who reads Portolab in one language on a computer set to the other, and every text would need a guard against formulas.
- **OpenDocument, the `.ods` format.** It is a zip archive of XML as well, so it costs as much to write, and most lecturers use Excel, whose own format is `.xlsx`.
- **ExcelJS.** It writes every feature of Excel, but it brings nine packages of its own for one worksheet, and its latest version, 4.4.0, came out in 2023.
- **SheetJS.** Its releases after 0.18.5 come only from its own server, which the delay of `minimumReleaseAge` in `pnpm-workspace.yaml` does not cover.
- **write-excel-file.** It is maintained and small, with fflate as its only dependency, but Portolab needs only one worksheet with inline strings and three built-in formats, which takes about 230 lines with what Node already has.

## Consequences

- Excel, Google Sheets, LibreOffice, and Numbers open the workbook without asking how to read it.
- The workbook holds the name and the username of each student, which leave Portolab on the computer of the lecturer, as the privacy notice says. Only the lecturer of the class can download it. Every other person gets the page for an address that does not exist, as for the page of the portfolios.
- React Router answers a route without a page as a resource, whose failures reach the reader as bare data. So the route of the workbook has the error boundary of the app, and its middleware answers with the file before any page renders.
- The workbook states when it was downloaded, but not which delayed prices the latest update could not fetch. The page of the portfolio of each student names them.
