import {
  createReadyTestLecturer,
  createTestStudent,
} from "~/features/accounts/accounts-for-test.server";
import { readMigrationFiles } from "drizzle-orm/migrator";
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, test } from "vitest";
import { closeDatabase, openDatabase } from "~/database/database.server";

test.each([true, false])(
  "migrates a database copy after manual order deletion and preserves rows and order numbering, with other orders kept: %s",
  async (keepOrders) => {
    const folder = mkdtempSync(join(tmpdir(), "portolab-demonstration-"));
    const migrations = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "migrations",
    );
    try {
      // The copied database must really use the former schema, including its migration journal.
      const previous = join(folder, "previous");
      mkdirSync(join(previous, "meta"), { recursive: true });
      const files = readdirSync(migrations)
        .filter((file) => file.endsWith(".sql"))
        .sort();
      const migrationIndex = files.indexOf("0007_demonstration_portfolios.sql");
      expect(migrationIndex).toBeGreaterThan(0);
      const earlier = readMigrationFiles({
        migrationsFolder: migrations,
      }).slice(0, migrationIndex);
      const entries = earlier.map((migration, index) => {
        const file = files[index];
        if (file === undefined)
          throw new Error("The migration has no SQL file.");
        copyFileSync(join(migrations, file), join(previous, file));
        return {
          ["idx"]: index,
          version: "6",
          when: migration.folderMillis,
          tag: file.slice(0, -4),
          breakpoints: migration.bps,
        };
      });
      writeFileSync(
        join(previous, "meta", "_journal.json"),
        JSON.stringify({ version: "7", dialect: "sqlite", entries }),
      );
      const original = openDatabase(join(folder, "original.sqlite"), previous);
      let cash: unknown;
      let holdings: unknown;
      let orders: unknown;
      try {
        await createReadyTestLecturer(original, "lecturer", "Lecturer");
        await createTestStudent(original, "student", "Student");
        await createTestStudent(original, "cash", "Cash");
        original.$client.exec(`
        INSERT INTO classes (id, name, lecturer_id, starting_cash, join_code, created_at) VALUES (7, 'Class', 1, 100000000, 'ABCDEF', 1793581200000);
        INSERT INTO memberships (id, class_id, student_id, joined_at) VALUES (42, 7, 2, 1793581200000), (43, 7, 3, 1793581200000);
        INSERT INTO portfolios (membership_id, cash) VALUES (42, 97506265), (43, 100000000);
        INSERT INTO holdings (membership_id, code, shares, cost) VALUES (42, 'BBCA', 500, 2493735);
        INSERT INTO orders (id, membership_id, code, side, lots, reason, placed_at, shares, trading_day, trades_from, expires_at, checked_price, set_aside_cash, state, ended_at, quoted_at, trade_price, trade_value, trade_fee, trade_tax) VALUES
          (20, 42, 'BBCA', 'buy', 5, 'Reason with a newline' || char(10) || 'and a second line.', 1793588400000, 500, '2026-11-02', 1793584800000, 1793611560000, 4980, 2493735, 'filled', 1793588400000, 1793587800000, 4980, 2490000, 3735, 0),
          (21, 42, 'BBCA', 'sell', 1, NULL, 1793588400000, 100, '2026-11-02', 1793584800000, 1793611560000, 4980, 0, 'waiting', NULL, NULL, NULL, NULL, NULL, NULL),
          (99, 42, 'BBCA', 'sell', 1, NULL, 1793588400000, 100, '2026-11-02', 1793584800000, 1793611560000, 4980, 0, 'waiting', NULL, NULL, NULL, NULL, NULL, NULL);
        DELETE FROM orders WHERE id = 99;
      `);
        if (!keepOrders) original.$client.exec("DELETE FROM orders");
        expect(
          original.$client
            .prepare("SELECT seq FROM sqlite_sequence WHERE name = 'orders'")
            .get(),
        ).toEqual({ seq: 99 });
        expect(
          original.$client
            .prepare("SELECT count(*) AS count FROM orders")
            .get(),
        ).toEqual({ count: keepOrders ? 2 : 0 });
        cash = original.$client
          .prepare(
            "SELECT membership_id, cash FROM portfolios ORDER BY membership_id",
          )
          .all();
        holdings = original.$client
          .prepare("SELECT membership_id AS portfolio_id, * FROM holdings")
          .all();
        orders = original.$client
          .prepare(
            "SELECT membership_id AS portfolio_id, * FROM orders ORDER BY id",
          )
          .all();
        await original.$client.backup(join(folder, "copy.sqlite"));
      } finally {
        closeDatabase(original);
      }
      const migrated = openDatabase(join(folder, "copy.sqlite"), migrations);
      try {
        expect(
          migrated.$client
            .prepare(
              "SELECT membership_id, cash FROM portfolios ORDER BY membership_id",
            )
            .all(),
        ).toEqual(cash);
        expect(
          migrated.$client
            .prepare("SELECT portfolio_id AS membership_id, * FROM holdings")
            .all(),
        ).toEqual(holdings);
        expect(
          migrated.$client
            .prepare(
              "SELECT portfolio_id AS membership_id, * FROM orders ORDER BY id",
            )
            .all(),
        ).toEqual(orders);
        expect(migrated.$client.pragma("foreign_key_check")).toEqual([]);
        migrated.$client.exec(
          "INSERT INTO portfolios (demonstration_class_id, cash) VALUES (7, 100000000)",
        );
        expect(
          migrated.$client
            .prepare(
              "SELECT id FROM portfolios WHERE demonstration_class_id = 7",
            )
            .get(),
        ).toEqual({ id: 44 });
        expect(
          migrated.$client
            .prepare(
              `
        INSERT INTO orders (portfolio_id, code, side, lots, placed_at, shares, trading_day, trades_from, expires_at, checked_price, set_aside_cash, state)
        VALUES (42, 'BBCA', 'sell', 1, 1793588400000, 100, '2026-11-02', 1793584800000, 1793611560000, 4980, 0, 'waiting') RETURNING id
      `,
            )
            .get(),
        ).toEqual({ id: 100 });
        migrated.$client.exec("DELETE FROM memberships WHERE id = 42");
        expect(migrated.$client.prepare("SELECT * FROM orders").all()).toEqual(
          [],
        );
        expect(
          migrated.$client.prepare("SELECT * FROM holdings").all(),
        ).toEqual([]);
        expect(
          migrated.$client
            .prepare("SELECT count(*) AS count FROM portfolios")
            .get(),
        ).toEqual({ count: 2 });
        migrated.$client.exec("DELETE FROM classes WHERE id = 7");
        expect(
          migrated.$client.prepare("SELECT * FROM portfolios").all(),
        ).toEqual([]);
      } finally {
        closeDatabase(migrated);
      }
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  },
);
