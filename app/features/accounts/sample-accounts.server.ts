import type { Database } from "~/database/database.server";
import { randomReadableText } from "~/random-text.server";
import { users, sessions } from "./accounts.schema";
import type { Role } from "./accounts.schema";
import { hashPassword } from "./password.server";
import { parseUsername } from "./username";

const samplePasswordLength = 20;

// These combinations were written for fictional students, rather than taken from a class list.
const sampleNames = [
  "Nara Kirana Prameswari",
  "Bagas Aditya Wicaksana",
  "Laras Sekar Daniswara",
  "Raka Banyu Mahardika",
  "Intan Aruna Puspitasari",
  "Dimas Surya Pranadipa",
  "Ayu Mentari Kusumadewi",
  "Fajar Langit Wiratama",
  "Citra Kemala Nawangwulan",
  "Rizki Galang Suryakanta",
  "Melati Anindya Prawesti",
  "Gilang Arya Sembada",
  "Putri Lintang Paramasari",
  "Bima Satya Danurdara",
  "Anisa Laras Kinasih",
  "Yoga Candra Pramudita",
  "Tiara Puspa Wening",
  "Reza Bayu Sasongko",
  "Nabila Sari Candrakirana",
  "Ilham Jati Wibisana",
  "Wulan Ratih Saraswati",
  "Andra Damar Prasetya",
  "Dewi Raras Purnamasari",
  "Farhan Nusa Wardhana",
  "Rahma Bulan Ayuningtyas",
  "Kevin Tunas Wijaksana",
  "Sinta Lembayung Kartika",
  "Arief Rimba Nugraha",
  "Vania Cahaya Permatasari",
  "Teguh Awan Setiaji",
];

/** Hashing precedes the write transaction, so a failure never leaves half a class. */
export async function prepareSampleAccounts(now: Date) {
  const accounts: (typeof users.$inferInsert & { password: string })[] = [];
  const passwords: Record<Role, string> = {
    lecturer: randomReadableText(samplePasswordLength),
    student: randomReadableText(samplePasswordLength),
  };
  const passwordHashes = {
    lecturer: await hashPassword(passwords.lecturer),
    student: await hashPassword(passwords.student),
  };
  const names = ["Dian Purnama Widyatama", ...sampleNames];
  for (const [index, name] of names.entries()) {
    const username = parseUsername(
      index === 0 ? "contoh-dosen" : `contoh-${String(index)}`,
      "The sample username",
    );
    if (!username.ok) throw new Error(username.failure);
    const role = index === 0 ? "lecturer" : "student";
    accounts.push({
      username: username.value,
      name,
      role,
      password: passwords[role],
      passwordHash: passwordHashes[role],
      mustChangePassword: false,
      consentedAt: now,
    });
  }
  return accounts;
}

export function saveSampleAccounts(
  database: Database,
  accounts: Awaited<ReturnType<typeof prepareSampleAccounts>>,
) {
  return accounts.map(({ password, ...account }) => {
    const created = database
      .insert(users)
      .values(account)
      .returning({ id: users.id, username: users.username, role: users.role })
      .get();
    return { ...created, password };
  });
}

/** Sessions are checked too, so a damaged database with an orphan cannot be mistaken for an empty one. */
export function hasAccountRecords(database: Database): boolean {
  return (
    database.select().from(users).get() !== undefined ||
    database.select().from(sessions).get() !== undefined
  );
}
