# Controls that navigate or open something

This audit lists every control of the mock that navigates or opens something, against principle 13 of the brief: information that a person asks for while doing something opens in place, and closing it returns them exactly where they were. A link that navigates lands on the exact thing it names, says in one line why the person is there when they came from a lesson, and leads back.

"In place" means a popover, an expansion, or a sheet over the current screen. A sheet closes with its close button, Escape, or a tap on the dimmed ground, and the screen under it keeps its state, including an order in progress in the ticket. "Back" means the back button of the browser, because every screen has its own address.

The column "Round 2" marks each row that this round changed, with what it did before.

| Screen | Control | What it opens | In place or navigation | How the reader returns | Round 2 |
| --- | --- | --- | --- | --- | --- |
| Every screen | Rail and tab bar items | The screen of the item | Navigation | The item of the screen before, or back | Added Portofolio for the lecturer |
| Every screen | Class switcher | A menu of classes, then Beranda or Kelas of the chosen class | Menu in place, then navigation | The switcher again | |
| Every screen | Simulation chip | The card "Simulasi dan harga tertunda" | In place | Closing the card | |
| Every screen, student on a desktop | Name chip | The profile menu with the theme | In place | Closing the menu | Changed: it looked clickable and did nothing |
| Every screen, lecturer | Join code chip | Copies the code and shows the join address | In place | Closing the popover | |
| Every screen | Avatar in the rail or the top bar | The profile menu with the theme | In place | Closing the menu | |
| Every screen | Every "?" beside a concept | The concept card with the reader's own number | In place | Closing the card | |
| Concept card | "Lihat perhitungan" | The formula with the reader's numbers | Expansion in place | Collapsing it | |
| Concept card | "Pelajari lebih lanjut: Sesi N" | The lesson in a sheet over the card | In place | Closing the sheet returns to the card, and closing the card returns to the screen | Changed: it navigated to the lesson and lost an order in progress |
| Concept card | "Kamus" | The glossary in a sheet, at the term | In place | Closing the sheet | Changed: it navigated to Kamus |
| Lesson in a sheet | "Buka di Belajar" | The full page of the lesson | Navigation | Back returns to the screen under the sheet, and the ticket restores the order in progress from its draft | Added |
| Lesson in a sheet | "Kerjakan di halaman pelajaran" | The practice of the lesson on its page | Navigation | Back | Added |
| Every screen with a trade, mock only | "Demo" | The demo control | In place | Closing the panel | |
| Beranda | "Sejak kunjungan terakhir", "Tutup" | Closes the card | In place | Not needed | |
| Beranda | "?" of value, today, since 14 Okt, beta, risk, Sharpe | The concept cards | In place | Closing the card | |
| Beranda | "Analisis" in "Risiko dibanding pasar" | Analisis, at its top | Navigation | Back | |
| Beranda | "Peta" and "Grafik waktu" | The two views of the panel | In place | The other option | |
| Beranda | A point of a holding on the map | The stock | Navigation | The back arrow of the stock page, or back | |
| Beranda | "Pelajari" in the insight row | The lesson of the insight in a sheet | In place | Closing the sheet | Changed: it navigated to the lesson |
| Beranda | A row of the holdings | The stock | Navigation | Back | |
| Beranda, empty | "Cari saham pertama Anda" | Pasar | Navigation | Back | |
| Beranda, empty | The card "Cara membaca harga saham" | The guide in a sheet | In place | Closing the sheet | Changed: it navigated to the guide |
| Beranda, empty | "Pelajari" in the insight row | Sesi 2 in a sheet | In place | Closing the sheet | Changed: it navigated to the lesson |
| Pasar | "Daftar" and "Peta" | The two views of the market | In place | The other option | |
| Pasar | Search, sector chips, sort menu, order arrow | Filters and orders the list in place | In place | Clearing them | |
| Pasar | Star | Adds the stock to the watchlist | In place | The star again | |
| Pasar | A row of the list or a point of the map | The stock | Navigation | The back arrow of the stock page, or back | |
| Pasar, from a practice | "Kembali ke pelajaran" in the task line | The practice of the lesson | Navigation | Lands on the practice | Added |
| Saham | Back arrow | The screen before | Navigation | Not needed | |
| Saham | Star | Adds the stock to the watchlist | In place | The star again | |
| Saham | Ranges of the chart | The range of the chart | In place | Another range | |
| Saham | "5%", "10%", "20%", "Beta", "Simpangan baku" of "Dampak ke portofolio" | The preview of the trade | In place | Another option | |
| Saham | "Buka tiket dengan N lot" | The ticket with those lots | The ticket docks beside the page or opens as a sheet over it | Closing the sheet | |
| Saham on a phone or tablet | "Beli" and "Jual" | The ticket as a sheet | In place | Closing the sheet keeps the stock page | Changed: green and red |
| Ticket | Every "?" and "Pelajari lebih lanjut" | Cards and lessons in sheets over the ticket | In place | Closing them keeps the lots, the price, and the reason | Changed: the lesson navigated away and lost the order |
| Ticket | Fixes of a rejected value, such as "Ubah ke 18 lot" | Sets the field | In place | Not needed | |
| Ticket, from a practice | "Kembali ke pelajaran" in the task line | The practice of Sesi 6 | Navigation | Lands on the practice | Added |
| Ticket, after an order | "Lihat di Aktivitas" | Aktivitas of the reader's own portfolio | Navigation | Back | Changed: the lecturer lands in Portofolio, Aktivitas |
| Ticket, after an order | "Selesai" or "Order baru" | Closes the ticket or clears it | In place | Not needed | |
| Aktivitas | Status chips | Filters the orders | In place | "Semua" | |
| Aktivitas | The code of an order or a trade | The stock | Navigation | Back | |
| Aktivitas | "Buka tiket" of a rejected order | The ticket of that stock | Navigation | Back | |
| Aktivitas | "Batalkan order", "Ya, batalkan", "Tidak" | Asks, then cancels in place | In place | "Tidak" | |
| Aktivitas on a phone | "Order" and "Jurnal" | The two lists | In place | The other option | |
| Analisis | "Beta" and "Simpangan baku" | The axis of the map | In place | The other option | |
| Analisis | A point of the map | The calculation of its alpha or risk in a card | In place | Closing the card | |
| Analisis | "Pelajari" in the insight row | Sesi 9 or Sesi 2 in a sheet | In place | Closing the sheet | Changed: it navigated to the lesson |
| Analisis | "Lihat perhitungan" of a measure | The concept card with the calculation open | In place | Closing the card | |
| Analisis | "Sektor" and "Saham" of the allocation | The grouping | In place | The other option | |
| Analisis | A cell of the correlations, a row of the risk sources | The calculation in a card | In place | Closing the card | |
| Belajar | A lesson card | The lesson page | Navigation | "Belajar" at the top of the lesson, or back | |
| Belajar | "Kamus istilah" | Kamus | Navigation | "Belajar" at the top of Kamus, or back | Changed: it looked like a search field |
| Lesson page | "Belajar" | Belajar | Navigation | Not needed | |
| Lesson page | "Langsung ke praktik" | Scrolls to the practice of the lesson | In place | Scrolling up | Changed: it was a "Praktikkan" chip that did nothing |
| Lesson page | A key term | Its meaning, expanded in place | Expansion in place | Collapsing it | Changed: it looked like a card and opened Kamus |
| Lesson page | "Lihat dengan angka Anda" in a key term | The concept card | In place | Closing the card | Added |
| Lesson page | Sliders, chips, "Kembalikan" of the interactive | The interactive | In place | "Kembalikan" | |
| Lesson page | Rows of the practice of Sesi 2 | The pair in the interactive above | In place | Another row | Added |
| Lesson page | Rows of the practice of Sesi 9 | The calculation of the alpha of that stock in a card | In place | Closing the card | Added |
| Lesson page | The task of Sesi 6 | The ticket of the reader's largest holding, on Limit, with the task in one line | Navigation | "Kembali ke pelajaran" lands on the practice | Changed: "Coba di Portolab" dropped the reader on a screen without a task or a way back |
| Lesson page | The task of the guide on prices | Pasar with the task in one line | Navigation | "Kembali ke pelajaran" lands on the practice | Changed: as above |
| Lesson page, before the first purchase | The task of Sesi 2, 9, or 10 | Pasar with the task in one line | Navigation | "Kembali ke pelajaran" lands on the practice | Added |
| Lesson page | The previous and the next lesson | The lesson page | Navigation | The other link, or back | |
| Short lessons 1, 3, 4, 5, 11 to 14 | "Coba di Portolab" | Removed, because these lessons have no meaningful practice | | | Removed |
| Kamus | Search | Filters the terms | In place | Clearing it | |
| Kamus | "Sesi N: title" of a term | The lesson in a sheet | In place | Closing the sheet | Changed: it navigated to the lesson |
| Kamus | "Lihat dengan angka" | The concept card | In place | Closing the card | |
| Kelas | "Beta" and "Simpangan baku" | The axis of the map | In place | The other option | |
| Kelas | A point of the map | Mahasiswa with that student selected | Navigation | Back | |
| Kelas | A flag of "Perlu perhatian" | Mahasiswa with that student selected, or with the filter of the flag | Navigation | Back | |
| Kelas | "Buka materi sesi N" | The lesson in a sheet | In place | Closing the sheet | Changed: it navigated to the lesson |
| Kelas | "Semua" of "Alasan terbaru" | All latest reasons in a sheet | In place | Closing the sheet | |
| Kelas | A reason | The journal of that student | Navigation | Back | |
| Mahasiswa | "Alpha Jensen", "Sharpe", "Treynor", search, filter chips | Ranks and filters the table | In place | Another option | |
| Mahasiswa | A row | Selects the student, in the panel or in a sheet on a narrow screen | In place | Another row, or closing the sheet | Changed: the panel docks from 1320 pixels and opens as a side sheet below |
| Mahasiswa | A point of the small map | Selects that student | In place | Another point | |
| Mahasiswa | "Unduh workbook" | A message that the mock does not download | In place | Not needed | |
| Mahasiswa panel | "Buka portofolio" and "Jurnal alasan" | The read-only view of the student | Navigation | The back arrow selects the same student again | |
| Read-only view of a student | "Ringkasan", "Analisis", "Jurnal dan order" | The three parts | In place | The other options | |
| Portofolio of the lecturer | "Ringkasan", "Aktivitas", "Analisis" | The three parts of the lecturer's own portfolio | In place, with its own address | The other options | Added |
| Not found | "Kembali ke awal" | The home of the role | Navigation | Not needed | |
