import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";

const texts: Record<
  Locale,
  { title: string; headings: readonly string[]; paragraphs: readonly string[] }
> = {
  id: {
    title: "Privasi",
    headings: [
      "Apa yang disimpan Portolab",
      "Siapa yang melihatnya",
      "Hak Anda",
    ],
    paragraphs: [
      "Portolab adalah simulasi manajemen portofolio untuk kelas. Portolab hanya menyimpan apa yang dibutuhkan kelas, dan meminta persetujuan Anda sebelum Anda mulai menggunakannya.",
      "Nama pengguna Anda, yang Anda pakai untuk masuk.",
      "Nama Anda, agar dosen sebuah kelas tahu milik siapa pekerjaan yang dilihatnya, dan agar mahasiswa tahu siapa yang mengajar kelasnya.",
      "Kata sandi Anda, hanya sebagai hash yang tidak dapat diubah kembali menjadi kata sandi.",
      "Kelas yang Anda ajar atau ikuti, dan pekerjaan simulasi Anda di dalamnya, seperti order dan portofolio Anda.",
      "Waktu ketika Anda menyetujui pemberitahuan ini.",
      "Untuk setiap perangkat tempat Anda masuk, sebuah cookie yang membuat Anda tetap masuk. Portolab hanya menyimpan hash-nya, dan sesi berakhir setelah 14 hari tanpa kunjungan.",
      "Nama pengguna yang diketik seseorang dengan kata sandi salah, hanya di memori, selama 15 menit setelah setiap kata sandi salah untuknya, untuk mencegah siapa pun menebak kata sandi sebuah akun.",
      "Alamat jaringan Anda, hanya di memori, selama 15 menit setelah setiap kata sandi salah dari jaringan itu, untuk mencegah siapa pun menebak kata sandi.",
      "Sebuah cookie berisi bahasa yang Anda pilih, yang tersimpan di peramban Anda.",
      "Portolab tidak menyimpan alamat email, nomor telepon, atau apa pun tentang keuangan Anda yang sebenarnya. Portolab tidak memakai pelacakan maupun iklan, dan tidak memberikan data Anda kepada siapa pun.",
      "Dosen sebuah kelas melihat nama, nama pengguna, dan pekerjaan setiap mahasiswa di kelas itu. Mahasiswa tidak melihat data mahasiswa lain.",
      "Orang yang menjalankan server Portolab ini dapat membaca semua yang disimpannya, karena mereka menyimpan basis datanya.",
      "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi memberi Anda hak untuk melihat, memperbaiki, dan menghapus data Anda, serta menarik persetujuan Anda. Portolab menyimpan data Anda sampai orang yang menjalankan server ini menghapusnya, jadi mintalah hal-hal tersebut kepada mereka.",
    ],
  },
  en: {
    title: "Privacy",
    headings: ["What Portolab stores", "Who sees it", "Your rights"],
    paragraphs: [
      "Portolab is a simulation of portfolio management for classes. It stores only what a class needs, and it asks for your agreement before you start to use it.",
      "Your username, which you sign in with.",
      "Your name, so that the lecturer of a class knows whose work it sees, and so that students know who teaches their class.",
      "Your password, only as a hash that cannot be turned back into the password.",
      "The classes that you teach or joined, and your simulated work in them, such as your orders and your portfolio.",
      "The time when you agreed to this notice.",
      "For each device where you are signed in, a cookie that keeps you signed in. Portolab stores only a hash of it, and the session ends after 14 days without a visit.",
      "A username that someone typed with a wrong password, in memory only, for 15 minutes after each wrong password for it, to stop anyone from guessing the password of an account.",
      "The address of your network, in memory only, for 15 minutes after each wrong password from it, to stop anyone from guessing passwords.",
      "A cookie with the language that you chose, which stays in your browser.",
      "Portolab stores no email address, no phone number, and nothing about your real finances. It uses no tracking and no advertising, and it gives your data to no one.",
      "The lecturer of a class sees the name, the username, and the work of each student in it. Students do not see the data of other students.",
      "The person who runs this Portolab server can read everything that it stores, because they keep its database.",
      "Indonesia's Law Number 27 of 2022 on Personal Data Protection gives you the right to see, correct, and delete your data, and to withdraw your agreement. Portolab keeps your data until the person who runs this server deletes it, so ask them for any of these.",
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`shows what Portolab stores, who sees it, and the rights of the reader in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.goto("/privacy");
    await expect(page).toHaveTitle(`${text.title} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.title }),
    ).toBeVisible();
    for (const heading of text.headings) {
      await expect(
        page.getByRole("heading", { level: 2, name: heading }),
      ).toBeVisible();
    }
    for (const paragraph of text.paragraphs) {
      await expect(page.getByText(paragraph, { exact: true })).toBeVisible();
    }
    await expectAccessibleScreen(page);
  });
}
