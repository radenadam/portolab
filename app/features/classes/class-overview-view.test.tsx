import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { createLecturerWithClassForTest } from "./classes-for-test.server";
import { findTaughtClass } from "./class-store.server";
import { languageNames } from "~/language-names";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { classOverviewForTest } from "./class-overview-for-test.server";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { cumulativeReturn } from "~/units/cumulative-return";
import { ClassOverviewView } from "./class-overview-view";
import { classMapPoints } from "./class-map-points.server";
import type { ClassMapAxis } from "./class-map";
import { readClassOverview } from "./read-class-overview.server";
import { classSummary } from "./class-summary";

const texts: Record<
  Locale,
  {
    noStudents: string;
    invitation: string;
    labels: readonly string[];
    betaAxis: string;
    deviationAxis: string;
    empty: string;
    active: readonly string[];
    inactive: readonly string[];
    stats: readonly string[];
  }
> = {
  id: {
    noStudents: "Belum ada mahasiswa yang bergabung.",
    invitation:
      "Bagikan kode gabung di bagian atas halaman agar mahasiswa dapat bergabung.",
    labels: [
      "Peta risiko dan imbal hasil",
      "Modal awal",
      "Median kelas -20,00%",
      "Tenang, untung",
      "Bergejolak, untung",
      "Tenang, rugi",
      "Bergejolak, rugi",
      "Beta",
      "Simpangan baku",
      "Apa itu Peta risiko dan imbal hasil?",
      "Tegak: imbal hasil sejak mahasiswa dapat bertransaksi. IHSG di peta adalah median imbal hasil IHSG pada periode yang sama. Batang di tepi menunjukkan sebaran titik. Garis pendek menandai median imbal hasil kelas. Portofolio tanpa ukuran risiko tidak tampil di peta. Tabel di bawah memuat setiap mahasiswa dan waktu harga sahamnya. Perbandingan memakai mahasiswa dengan imbal hasil portofolio dan IHSG. Hitungan risiko memakai portofolio terukur.",
      "Imbal hasil",
      "Risiko",
      "Waktu harga",
      "Order terakhir",
      "Belum pernah memasang order",
      "Lihat data mahasiswa dan waktu harga",
      "Kalender dan mahasiswa",
    ],
    betaAxis: "Beta portofolio terhadap IHSG",
    deviationAxis: "Simpangan baku per bulan",
    empty:
      "Peta menunggu imbal hasil IHSG dan ukuran risiko portofolio. Buka tabel untuk melihat data yang tersedia.",
    active: ["Aktif minggu ini · 1", "Aktif minggu ini · 2"],
    inactive: [
      "Belum bertransaksi minggu ini · 1",
      "Belum bertransaksi minggu ini · 2",
    ],
    stats: [
      "mahasiswa",
      "aktif minggu ini (0%)",
      "order minggu ini",
      "median beta kelas",
      "belum ada",
      "Tanpa saham",
    ],
  },
  en: {
    noStudents: "No student has joined yet.",
    invitation:
      "Share the join code at the top of the page so that students can join.",
    labels: [
      "Risk and return map",
      "Starting cash",
      "Class median -20.00%",
      "Calmer, gain",
      "More volatile, gain",
      "Calmer, loss",
      "More volatile, loss",
      "Beta",
      "Standard deviation",
      "What is Risk and return map?",
      "Up: return since each student could trade. IHSG on the map is the median IHSG return over those periods. Edge bars show the distribution of points. The short line marks the median class return. Portfolios without risk measures do not appear on the map. The table below includes every student and the times of their stock prices. Comparison counts require portfolio and IHSG returns. Risk counts include measured portfolios.",
      "Return",
      "Risk",
      "Price times",
      "Latest order",
      "No order placed yet",
      "View student data and price times",
      "Calendar and students",
    ],
    betaAxis: "Portfolio beta against IHSG",
    deviationAxis: "Standard deviation per month",
    empty:
      "The map needs IHSG returns and portfolio risk measures. Open the table to see the available data.",
    active: ["Active this week · 1", "Active this week · 2"],
    inactive: ["No order this week · 1", "No orders this week · 2"],
    stats: [
      "student",
      "students",
      "active this week (0%)",
      "order this week",
      "orders this week",
      "median class beta",
      "pending",
      "No stocks",
    ],
  },
};

for (const locale of locales) {
  test(`shows the join step and no empty table before a student joins in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const database = openDatabaseForTest();
    const { classId, lecturerId } =
      await createLecturerWithClassForTest(database);
    const taught = findTaughtClass(database, classId, lecturerId);
    if (taught === undefined) throw new Error("The test class is missing.");
    const overview = readClassOverview(database, taught, {
      request: new Request("http://localhost/classes/1"),
      now: new Date("2026-11-02T03:00:00Z"),
      delayMinutes: 10,
    });
    expect(overview.students).toEqual([]);
    for (const axis of ["beta", "deviation"] satisfies ClassMapAxis[]) {
      const html = renderTextMarkupForTest(
        <MemoryRouter>
          <ClassOverviewView
            classId={classId}
            overview={overview}
            axis={axis}
            points={[]}
            administration={null}
          />
        </MemoryRouter>,
      );
      expect(html).toContain(
        `${texts[locale].noStudents} ${texts[locale].invitation}`,
      );
      expect(html).not.toContain(texts[locale].empty);
      expect(html).not.toContain("<table");
    }
  });
  test(`draws the class map and its data before JavaScript, with either risk axis and all count forms in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { overview, taughtClass } = await classOverviewForTest();
    const renders: string[] = [];
    const render = (shown: typeof overview, axis: ClassMapAxis): string =>
      renderTextMarkupForTest(
        <MemoryRouter>
          <ClassOverviewView
            classId={taughtClass.id}
            overview={shown}
            axis={axis}
            points={classMapPoints(shown, { axis, classId: taughtClass.id })}
            administration={null}
          />
        </MemoryRouter>,
      );
    for (const axis of ["beta", "deviation"] satisfies ClassMapAxis[]) {
      for (const active of [0, 1, 2]) {
        const shown = {
          ...overview,
          students: overview.students.map((student, index) => ({
            ...student,
            ordersThisWeek: index < active ? 1 : 0,
          })),
          ordersThisWeek: active,
          summary: {
            ...overview.summary,
            medianReturn: cumulativeReturn(-0.2),
            marketReturn: cumulativeReturn(-0.1),
          },
        };
        renders.push(render(shown, axis));
      }
    }
    renders.push(
      render({ ...overview, students: overview.students.slice(0, 1) }, "beta"),
    );
    const profitable = overview.students
      .filter((student) => student.risk !== undefined)
      .map((student) => ({
        ...student,
        return: cumulativeReturn(0.2),
        marketReturn: cumulativeReturn(0.1),
      }));
    renders.push(
      render(
        {
          ...overview,
          students: profitable,
          summary: classSummary(
            profitable.map((student) => ({
              portfolio: student.return,
              market: student.marketReturn,
            })),
            profitable.flatMap((student) =>
              student.risk === undefined ? [] : [student.risk.beta],
            ),
          ),
        },
        "beta",
      ),
    );
    const cashOnly = overview.students.filter(
      (student) => student.return === 0 && student.risk === undefined,
    );
    expect(cashOnly.length).toBeGreaterThan(0);
    renders.push(
      render(
        {
          ...overview,
          students: cashOnly,
          summary: classSummary(
            cashOnly.map(() => ({
              portfolio: cumulativeReturn(0),
              market: cumulativeReturn(-0.1),
            })),
            [],
          ),
        },
        "beta",
      ),
    );
    const html = renders.join("");
    const text = texts[locale];
    for (const expected of [
      ...text.labels,
      text.betaAxis,
      text.deviationAxis,
      text.empty,
      ...text.active,
      ...text.inactive,
      ...text.stats,
    ]) {
      expect(html).toContain(renderTextMarkupForTest(<>{expected}</>));
    }
    expect(html).toContain("<rect");
    expect(html).not.toContain('role="slider"');
    expect(html).toContain('href="/?axis=deviation"');
    expect(html).toContain(
      `/students/${String(overview.students[0]?.id)}/portfolio`,
    );
  });
}
