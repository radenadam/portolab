import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { classCalendarOf } from "./course-calendar";
import { CourseCalendarNotice } from "./course-calendar-notice";
import type { Role } from "~/features/accounts/accounts.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { dayMilliseconds } from "~/time-units";

// Session 1 of the odd class meets on Saturday 12 September 2026, and each later session one week after the one before, on the dates of the table. Session 1 of the even class meets on Saturday 6 February 2027. A week in WIB starts at 17:00 UTC on the Sunday before.
const oddClass = "2026-09-12";
const evenClass = "2027-02-06";
const mondayOfSession1 = new Date("2026-09-06T17:00:00.000Z");
const weekMilliseconds = 7 * dayMilliseconds;

const texts: Record<
  Locale,
  {
    noCalendar: Record<Role, string>;
    oddTerm: string;
    evenTerm: string;
    ahead: string;
    evenAhead: string;
    sessions: readonly (readonly [string, string])[];
    session: readonly [string, string, string, string];
    over: string;
  }
> = {
  id: {
    noCalendar: {
      lecturer:
        "Portolab belum mengetahui tanggal sesi 1 kelas ini, sehingga belum dapat menunjukkan sesi setiap minggu kepada Anda dan mahasiswa Anda.",
      student:
        "Dosen Anda belum mengatur tanggal sesi 1 kelas ini. Portolab menunjukkan sesi setiap minggu setelah dosen Anda mengaturnya.",
    },
    oddTerm: "Kelas ini termasuk semester Ganjil 2026/2027.",
    evenTerm: "Kelas ini termasuk semester Genap 2026/2027.",
    ahead:
      'Kuliah kelas ini dimulai dengan sesi 1, "Konsep dasar manajemen portofolio", pada Sabtu, 12 September 2026.',
    evenAhead:
      'Kuliah kelas ini dimulai dengan sesi 1, "Konsep dasar manajemen portofolio", pada Sabtu, 6 Februari 2027.',
    sessions: [
      ["Konsep dasar manajemen portofolio", "Sabtu, 12 September 2026"],
      ["Teori portofolio", "Sabtu, 19 September 2026"],
      ["Nilai waktu uang", "Sabtu, 26 September 2026"],
      ["Pasar modal", "Sabtu, 3 Oktober 2026"],
      ["Instrumen pasar modal", "Sabtu, 10 Oktober 2026"],
      ["Mekanisme perdagangan", "Sabtu, 17 Oktober 2026"],
      ["Review proposal penelitian", "Sabtu, 24 Oktober 2026"],
      [
        "Ujian tengah semester dan proposal penelitian final",
        "Sabtu, 31 Oktober 2026",
      ],
      ["CAPM dan garis pasar sekuritas", "Sabtu, 7 November 2026"],
      ["Imbal hasil dan risiko portofolio", "Sabtu, 14 November 2026"],
      ["Forward dan futures", "Sabtu, 21 November 2026"],
      ["Reksa dana", "Sabtu, 28 November 2026"],
      ["Opsi", "Sabtu, 5 Desember 2026"],
      ["Obligasi", "Sabtu, 12 Desember 2026"],
      ["Review artikel ilmiah", "Sabtu, 19 Desember 2026"],
      [
        "Ujian akhir semester dan artikel ilmiah final",
        "Sabtu, 26 Desember 2026",
      ],
    ],
    session: ["Sesi minggu ini adalah sesi ", ' dari 16, "', '", pada ', "."],
    over: 'Kuliah kelas ini berakhir dengan sesi 16, "Ujian akhir semester dan artikel ilmiah final", pada Sabtu, 26 Desember 2026.',
  },
  en: {
    noCalendar: {
      lecturer:
        "Portolab does not know the date of session 1 of this class yet, so it cannot show you and your students the session of each week.",
      student:
        "Your lecturer has not set the date of session 1 of this class yet. Portolab shows the session of each week once your lecturer sets it.",
    },
    oddTerm: "This class belongs to the odd semester of 2026/2027.",
    evenTerm: "This class belongs to the even semester of 2026/2027.",
    ahead:
      'The course of this class starts with session 1, "Basic concepts of portfolio management", on Saturday, September 12, 2026.',
    evenAhead:
      'The course of this class starts with session 1, "Basic concepts of portfolio management", on Saturday, February 6, 2027.',
    sessions: [
      [
        "Basic concepts of portfolio management",
        "Saturday, September 12, 2026",
      ],
      ["Portfolio theory", "Saturday, September 19, 2026"],
      ["The time value of money", "Saturday, September 26, 2026"],
      ["The capital market", "Saturday, October 3, 2026"],
      ["Instruments of the capital market", "Saturday, October 10, 2026"],
      ["The mechanism of trading", "Saturday, October 17, 2026"],
      ["Review of the research proposal", "Saturday, October 24, 2026"],
      [
        "Midterm exam and the final research proposal",
        "Saturday, October 31, 2026",
      ],
      ["CAPM and the security market line", "Saturday, November 7, 2026"],
      ["Portfolio return and risk", "Saturday, November 14, 2026"],
      ["Forwards and futures", "Saturday, November 21, 2026"],
      ["Mutual funds", "Saturday, November 28, 2026"],
      ["Options", "Saturday, December 5, 2026"],
      ["Bonds", "Saturday, December 12, 2026"],
      ["Review of the research article", "Saturday, December 19, 2026"],
      [
        "Final exam and the final research article",
        "Saturday, December 26, 2026",
      ],
    ],
    session: [
      "The session of this week is session ",
      ' of 16, "',
      '", on ',
      ".",
    ],
    over: 'The course of this class ended with session 16, "Final exam and the final research article", on Saturday, December 26, 2026.',
  },
};

// React writes a quote in text as an entity, so the paragraphs are compared in the form that React writes them.
function paragraphs(...texts: readonly string[]): string {
  return renderToStaticMarkup(
    <>
      {texts.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </>,
  );
}

function renderNotice(
  firstSessionDate: string | null,
  now: Date,
  role: Role,
): string {
  return renderToStaticMarkup(
    <CourseCalendarNotice
      calendar={classCalendarOf(firstSessionDate, now)}
      role={role}
    />,
  );
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`says to each role that Portolab cannot show the session of the week until the lecturer sets the date of session 1, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const role of ["lecturer", "student"] as const) {
      expect(renderNotice(null, mondayOfSession1, role), role).toBe(
        paragraphs(text.noCalendar[role]),
      );
    }
  });

  test(`names the semester and session 1 before the course starts, in ${language}`, () => {
    switchLocaleForTest(locale);
    const sundayBefore = new Date(mondayOfSession1.getTime() - 1);
    for (const role of ["lecturer", "student"] as const) {
      expect(renderNotice(oddClass, sundayBefore, role), role).toBe(
        paragraphs(text.oddTerm, text.ahead),
      );
    }
    expect(renderNotice(evenClass, sundayBefore, "student")).toBe(
      paragraphs(text.evenTerm, text.evenAhead),
    );
  });

  test(`names the semester and the session of each week of the course, with its title and the day when it meets, in ${language}`, () => {
    switchLocaleForTest(locale);
    const [before, count, title, end] = text.session;
    for (const [week, [sessionTitle, date]] of text.sessions.entries()) {
      const monday = new Date(
        mondayOfSession1.getTime() + week * weekMilliseconds,
      );
      expect(renderNotice(oddClass, monday, "student"), sessionTitle).toBe(
        paragraphs(
          text.oddTerm,
          `${before}${String(week + 1)}${count}${sessionTitle}${title}${date}${end}`,
        ),
      );
    }
  });

  test(`names the semester and the last session after the course ends, in ${language}`, () => {
    switchLocaleForTest(locale);
    const mondayAfter = new Date(
      mondayOfSession1.getTime() + text.sessions.length * weekMilliseconds,
    );
    expect(renderNotice(oddClass, mondayAfter, "lecturer")).toBe(
      paragraphs(text.oddTerm, text.over),
    );
  });
}
