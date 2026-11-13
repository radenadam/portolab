import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { ClassSwitcher } from "./class-switcher";
import type { WorkspaceClass } from "./frame-reader";

const texts: Record<
  Locale,
  {
    switcher: string;
    oddTerm: string;
    evenTerm: string;
    joinedClasses: string;
    taughtClasses: string;
    join: string;
    createClass: string;
    oneStudent: string;
    severalStudents: string;
  }
> = {
  id: {
    switcher: "Pilih kelas",
    oddTerm: "Ganjil 2026/2027",
    evenTerm: "Genap 2026/2027",
    joinedClasses: "Kelas Anda",
    taughtClasses: "Kelas yang Anda ajar",
    join: "Gabung ke kelas",
    createClass: "Buat kelas",
    oneStudent: "1 mahasiswa",
    severalStudents: "32 mahasiswa",
  },
  en: {
    switcher: "Choose a class",
    oddTerm: "Odd 2026/2027",
    evenTerm: "Even 2026/2027",
    joinedClasses: "Your classes",
    taughtClasses: "Classes you teach",
    join: "Join a class",
    createClass: "Create a class",
    oneStudent: "1 student",
    severalStudents: "32 students",
  },
};

const oddTerm: WorkspaceClass["term"] = {
  semester: "odd",
  academicYear: { from: "2026-07-01", until: "2027-06-30" },
};
const evenTerm: WorkspaceClass["term"] = {
  semester: "even",
  academicYear: { from: "2026-07-01", until: "2027-06-30" },
};

// The names of the classes of CSS modules carry a hash, and the icons are paths of their own, so the test leaves both out to read the text and the links.
function withoutClassesAndIcons(html: string): string {
  return html
    .replaceAll(/ class="[^"]*"/g, "")
    .replaceAll(/<svg.*?<\/svg>/g, "<svg/>");
}

function classLink({
  path,
  name,
  details,
  isCurrent,
}: {
  path: string;
  name: string;
  details: string;
  isCurrent: boolean;
}): string {
  return `<li><a${isCurrent ? ' aria-current="true"' : ""} href="${path}" data-discover="true"><span><span>${name}</span><span>${details}</span></span>${isCurrent ? "<svg/>" : ""}</a></li>`;
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`names the class of a student with its term, and opens every class of the student with its lecturer and its term, leading to its home, and then joining another class, in ${language}`, () => {
    switchLocaleForTest(locale);
    const first: WorkspaceClass = {
      id: 3 as WorkspaceClass["id"],
      name: "Manajemen Portofolio A",
      term: oddTerm,
      people: { kind: "lecturer", name: "Budi Santoso" },
    };
    const second: WorkspaceClass = {
      id: 5 as WorkspaceClass["id"],
      name: "Analisis Investasi C",
      term: evenTerm,
      people: { kind: "lecturer", name: "Rina Hartono" },
    };
    expect(
      withoutClassesAndIcons(
        renderInRouterForTest(
          <ClassSwitcher
            readerRole="student"
            workspace={{ current: first, classes: [first, second] }}
          />,
        ),
      ),
    ).toBe(
      [
        `<button type="button" popoverTarget="class-switcher" style="anchor-name:--class-switcher"><span><span>Manajemen Portofolio A</span><span>${text.oddTerm}</span></span><svg/></button>`,
        `<div id="class-switcher" popover="auto" role="dialog" aria-label="${text.switcher}" style="position-anchor:--class-switcher"><p>${text.joinedClasses}</p><ul>`,
        classLink({
          path: "/classes/3/portfolio",
          name: "Manajemen Portofolio A",
          details: `Budi Santoso · ${text.oddTerm}`,
          isCurrent: true,
        }),
        classLink({
          path: "/classes/5/portfolio",
          name: "Analisis Investasi C",
          details: `Rina Hartono · ${text.evenTerm}`,
          isCurrent: false,
        }),
        `</ul><hr/><a href="/join" data-discover="true">${text.join}</a></div>`,
      ].join(""),
    );
  });

  test(`names the class of a lecturer without a term until its lecturer sets the date of its first session, and opens every class of the lecturer with the number of its students, and then creating a class, in ${language}`, () => {
    switchLocaleForTest(locale);
    const first: WorkspaceClass = {
      id: 3 as WorkspaceClass["id"],
      name: "Manajemen Portofolio A",
      term: undefined,
      people: { kind: "students", count: 1 },
    };
    const second: WorkspaceClass = {
      id: 5 as WorkspaceClass["id"],
      name: "Manajemen Portofolio B",
      term: oddTerm,
      people: { kind: "students", count: 32 },
    };
    const html = withoutClassesAndIcons(
      renderInRouterForTest(
        <ClassSwitcher
          readerRole="lecturer"
          workspace={{ current: first, classes: [first, second] }}
        />,
      ),
    );
    expect(html).toContain(
      "<span><span>Manajemen Portofolio A</span></span><svg/></button>",
    );
    expect(html).toContain(
      [
        `<p>${text.taughtClasses}</p><ul>`,
        classLink({
          path: "/classes/3",
          name: "Manajemen Portofolio A",
          details: text.oneStudent,
          isCurrent: true,
        }),
        classLink({
          path: "/classes/5",
          name: "Manajemen Portofolio B",
          details: `${text.severalStudents} · ${text.oddTerm}`,
          isCurrent: false,
        }),
        `</ul><hr/><a href="/classes#create-class" data-discover="true">${text.createClass}</a>`,
      ].join(""),
    );
  });
}
