# Kamus

## alpha-jensen | Alpha Jensen | 9

Selisih antara imbal hasil yang diharapkan dan imbal hasil yang disyaratkan CAPM. Positif berarti di atas garis pasar sekuritas untuk beta yang sama, bukan jaminan keuntungan berikutnya.

{{formula:jensens-alpha}}

## ara | ARA (auto rejection atas) | 6

Batas atas harga order terhadap harga acuan. Besar batas mengikuti aturan yang berlaku pada tanggal perdagangan.

{{table:trading-rules}}

## arb | ARB (auto rejection bawah) | 6

Batas bawah harga order terhadap harga acuan. Batas ini membatasi harga order, bukan seluruh kerugian yang mungkin dialami investor.

{{table:trading-rules}}

## beta | Beta | 9

Kepekaan imbal hasil terhadap imbal hasil pasar. Beta mengukur paparan pasar, bukan seluruh risiko, sehingga beta rendah tidak selalu berarti simpangan baku rendah.

{{formula:beta}}

## bi-rate | BI-Rate | 9

Suku bunga kebijakan Bank Indonesia. Portolab memakainya sebagai pendekatan tingkat bebas risiko, bukan sebagai bunga yang dibayarkan pada kas simulasi.

{{formula:risk-free-rate}}

## biaya-broker | Biaya broker | 6

Biaya jasa transaksi melalui perusahaan efek. Tarif dan cara menghitung biaya memengaruhi total dana pembelian dan penerimaan penjualan.

{{table:transaction-costs}}

## bobot | Bobot | 10

Bagian nilai satu aset dari nilai seluruh portofolio. Kas juga termasuk dalam total, sehingga bobot saham saja belum tentu mencakup seluruh portofolio.

## capm | CAPM | 9

Model yang menghubungkan imbal hasil yang disyaratkan dengan beta dan premi risiko pasar. Hasilnya bergantung pada asumsi model dan perkiraan masukan.

{{formula:required-return}}

## diversifikasi | Diversifikasi | 2

Penyebaran dana ke aset dengan sumber risiko yang berbeda. Hubungan imbal hasil antaraset dapat mengurangi risiko gabungan, tetapi tidak menjamin keuntungan atau menghilangkan risiko pasar.

## forward | Forward | 11

Kontrak antara dua pihak untuk transaksi masa depan dengan harga dan ketentuan yang disepakati. Kontrak ini menimbulkan kewajiban serta risiko pihak lawan tidak memenuhi janji.

## fraksi-harga | Fraksi harga | 6

Langkah harga yang diperbolehkan untuk order. Langkah ini bergantung pada aturan kelompok harga yang berlaku.

{{table:trading-rules}}

## futures | Futures | 11

Kontrak standar yang diperdagangkan di bursa untuk transaksi masa depan. Laba dan rugi diselesaikan setiap hari, sehingga perubahan harga dapat menuntut tambahan margin.

## harga-acuan | Harga acuan | 6

Harga dasar untuk menghitung batas order. Bedakan harga acuan dari kutipan terakhir, lalu baca dasar penentuannya dalam aturan perdagangan.

{{table:trading-rules}}

## harga-rata-rata | Harga rata-rata | 6

Biaya per lembar dari saham yang masih dimiliki. Dalam Portolab, biaya pembelian termasuk dalam dasar biaya, sedangkan biaya penjualan belum terjadi.

## harga-tertunda | Harga tertunda | 6

Kutipan harga yang diterima setelah transaksi bursa terjadi. Waktu kutipan menunjukkan umur harga, sehingga harga yang tampil bukan janji harga pasar saat ini.

{{table:price-source}}

## ihsg | IHSG | 4

Indeks Harga Saham Gabungan, yang merangkum kinerja harga saham dalam cakupan indeksnya di BEI. Portolab menggunakannya sebagai acuan pasar untuk perbandingan imbal hasil dan beta.

## imbal-hasil | Imbal hasil | 10

Perubahan nilai relatif terhadap nilai awal selama suatu periode. Imbal hasil total dapat mencakup pendapatan seperti dividen, sedangkan imbal hasil harga hanya menghitung perubahan harga.

## imbal-hasil-harapan | Imbal hasil yang diharapkan | 10

Perkiraan imbal hasil untuk suatu periode. Portolab menggunakan rata-rata imbal hasil historis, sehingga nilainya adalah perkiraan dan bukan hasil yang dijamin.

{{table:estimation-settings}}

## kas | Kas | 9

Dana dalam portofolio yang belum menjadi saham. Kas Portolab tidak berbunga. Kas mengurangi paparan saham, tetapi berbeda dari aset yang memperoleh tingkat bebas risiko.

## kedaluwarsa | Kedaluwarsa | 6

Keadaan order yang belum terisi ketika masa berlakunya berakhir. Order yang kedaluwarsa tidak sama dengan order yang ditolak saat diperiksa.

## kontribusi-risiko | Kontribusi risiko | 10

Bagian varians portofolio yang disumbang satu saham, dari bobot dan kovariansnya dengan portofolio. Kontribusi dapat negatif jika saham meredam gerak portofolio. Ukuran ini tidak terdefinisi ketika varians portofolio nol.

{{formula:variance-share}}

## korelasi | Korelasi | 2

Ukuran arah dan kekuatan hubungan linear dua imbal hasil. Korelasi negatif berarti keduanya cenderung bergerak berlawanan. Korelasi tidak terdefinisi jika salah satu simpangan bakunya nol.

{{formula:correlation}}

## kovarians | Kovarians | 10

Ukuran gerak bersama dua imbal hasil terhadap rata-ratanya. Positif berarti penyimpangan cenderung searah. Besarnya juga dipengaruhi skala, sehingga berbeda dari korelasi.

{{formula:covariance}}

## laba-rugi | Laba atau rugi belum terealisasi | 6

Selisih nilai pasar saham yang masih dimiliki dengan dasar biaya pembeliannya. Nilai ini berubah mengikuti harga dan belum memperhitungkan biaya penjualan yang belum terjadi.

## lot | Lot | 6

Satuan jumlah saham dalam order. Harga saham dikutip per lembar, sehingga aturan jumlah lembar per lot diperlukan untuk menghitung nilai order.

{{table:trading-rules}}

## lq45 | LQ45 | 4

Indeks saham BEI dengan pemilihan berdasarkan kriteria seperti likuiditas dan kapitalisasi pasar. Keanggotaan dapat berubah dan bukan pernyataan bahwa saham pasti memberi keuntungan.

## nilai-portofolio | Nilai portofolio | 10

Kas ditambah nilai pasar seluruh saham yang dimiliki. Untuk menilai umur nilainya, perhatikan waktu harga yang dipakai pada setiap saham.

## obligasi | Obligasi | 14

Surat utang dengan ketentuan pembayaran pokok dan, jika ada, kupon. Harga pasar dapat berubah, dan janji pembayaran tetap memiliki risiko gagal bayar.

## opsi | Opsi | 13

Kontrak yang memberi pembeli hak membeli atau menjual aset pada harga pelaksanaan sesuai waktunya. Pembeli membayar premi, sedangkan penjual menerima kewajiban jika hak dilaksanakan.

## order-limit | Order limit | 6

Order dengan batas harga. Beli hanya boleh terisi pada harga limit atau lebih rendah, dan jual pada harga limit atau lebih tinggi. Order dapat berakhir tanpa terisi.

## order-pasar | Order pasar | 6

Order yang tidak menetapkan harga limit. Dalam pasar nyata harga terisi dapat berbeda dari harga terakhir yang terlihat. Portolab mendekatinya dengan kutipan tertunda yang memenuhi aturan pengisian.

## pph-final | PPh final penjualan saham | 6

Pajak atas nilai penjualan saham, bukan hanya atas labanya. Pajak ini mengurangi penerimaan penjualan meskipun saham dijual rugi.

{{table:transaction-costs}}

## premi-risiko-pasar | Premi risiko pasar | 9

Selisih imbal hasil pasar yang diharapkan dengan tingkat bebas risiko. Dalam CAPM, premi ini menentukan kemiringan garis pasar sekuritas. Perkiraan historisnya dapat negatif.

## rasio-sharpe | Rasio Sharpe | 10

Imbal hasil di atas tingkat bebas risiko untuk setiap satuan simpangan baku. Sharpe menggunakan risiko total dan tidak terdefinisi jika simpangan baku nol.

{{formula:sharpe}}

## rasio-treynor | Rasio Treynor | 10

Imbal hasil di atas tingkat bebas risiko untuk setiap satuan beta. Portolab menampilkannya hanya untuk beta positif, karena beta nol membuatnya tidak terdefinisi dan beta negatif membuat urutan nilainya menyesatkan.

{{formula:treynor}}

## reksa-dana | Reksa dana | 12

Wadah dana bersama yang dikelola manajer investasi sesuai kebijakan investasi. Investor memegang unit penyertaan yang nilainya mengikuti aset bersih portofolio, bukan simpanan dengan hasil yang dijamin.

## risiko-sistematis | Risiko sistematis | 9

Risiko dari faktor pasar yang tetap ada dalam portofolio yang terdiversifikasi. Dalam CAPM, beta mengukur paparan terhadap risiko ini.

## risiko-tidak-sistematis | Risiko tidak sistematis | 2

Risiko yang terkait dengan perusahaan atau kelompok aset tertentu. Penyebaran dana ke aset dengan sumber risiko berbeda dapat menguranginya.

## sesi | Sesi perdagangan | 6

Bagian waktu perdagangan dalam hari bursa. Jadwal yang berlaku menentukan kapan transaksi dapat berlangsung, dan hari libur bursa juga perlu diperhatikan.

{{table:trading-sessions}}

## simpangan-baku | Simpangan baku | 10

Akar varians yang mengukur penyebaran imbal hasil dalam satuan imbal hasil. Nilai ini bukan batas kerugian dan tidak menjanjikan bahwa hasil berikutnya berada dalam rentang tertentu.

## sml | Garis pasar sekuritas (SML) | 9

Garis yang menghubungkan beta dengan imbal hasil yang disyaratkan CAPM. Jarak vertikal imbal hasil yang diharapkan dari garis adalah alpha Jensen.

{{formula:required-return}}

## varians | Varians | 10

Ukuran penyebaran dari kuadrat penyimpangan imbal hasil terhadap rata-ratanya. Varians sampel menggunakan derajat bebas sampel dalam pembaginya.

{{formula:variance}}

## volatilitas | Volatilitas | 10

Sebutan untuk besarnya fluktuasi. Dalam pengukuran Portolab, volatilitas adalah simpangan baku imbal hasil. Bandingkan nilainya hanya pada frekuensi dan periode data yang sama.
