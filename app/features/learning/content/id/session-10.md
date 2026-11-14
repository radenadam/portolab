# Imbal hasil dan risiko portofolio

## summary

Gunakan bobot untuk imbal hasil, lalu sertakan kovarians untuk risiko.

## key-idea

Imbal hasil portofolio adalah rata-rata tertimbang, tetapi risikonya juga bergantung pada hubungan antaraset.

## body

Pisahkan hasil yang sudah terjadi dari perkiraan. Perubahan nilai portofolio selama Anda mengelolanya adalah hasil periode itu. Rata-rata imbal hasil historis aset dengan bobot saat ini adalah perkiraan untuk susunan saat ini, bukan rekonstruksi hasil transaksi Anda.

{{formula:weighted-return}}

Bobot menunjukkan bagian nilai setiap aset dari keseluruhan, termasuk kas. Mengubah bobot mengubah perkiraan imbal hasil dan risiko. Kas dalam Portolab tidak berbunga, sehingga tidak memperoleh imbal hasil BI-Rate.

Varians mencatat penyebaran imbal hasil, sedangkan kovarians mencatat bagaimana dua imbal hasil bergerak bersama. Varians portofolio memasukkan keduanya. Simpangan baku adalah akar varians dan kembali ke satuan imbal hasil.

{{formula:variance}}

{{formula:covariance}}

{{formula:portfolio-variance}}

Bagian varians yang disumbang suatu saham dapat berbeda jauh dari bobotnya. Kontribusi negatif dapat terjadi jika saham itu meredam gerak portofolio. Kontribusi ini bukan jumlah uang yang akan hilang.

{{formula:variance-share}}

Sharpe membandingkan imbal hasil di atas tingkat bebas risiko dengan risiko total. Treynor membandingkannya dengan beta. Keduanya menjawab pertanyaan berbeda, sehingga dapat memberi urutan portofolio yang berbeda.

{{formula:sharpe}}

{{formula:treynor}}

Sharpe tidak terdefinisi ketika simpangan baku nol. Treynor tidak terdefinisi ketika beta nol, dan urutan berdasarkan nilai yang lebih tinggi dapat menyesatkan ketika beta negatif. Portolab tidak menampilkan Treynor untuk beta yang tidak positif.

Bandingkan ukuran pada periode dan frekuensi yang sama. Harga historis tanpa dividen mengukur perubahan harga, bukan seluruh pendapatan investor. Hasil pengukuran tidak menjamin hasil masa depan.

## interactive

## terms

- bobot
- kovarians
- kontribusi-risiko
- rasio-sharpe
- rasio-treynor

## practice
