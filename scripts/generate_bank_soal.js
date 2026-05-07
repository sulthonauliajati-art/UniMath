const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../bank-soal-final');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function escapeCSV(text) {
  if (text == null) return '';
  const str = String(text);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function saveCSV(filename, questions) {
  const headers = ['mode','indicator','difficulty','question_type','question','opt_a','opt_b','opt_c','opt_d','correct','hint1','hint2','hint3','explanation','remedial_material_id'];
  let csvContent = headers.join(',') + '\n';
  
  for (const q of questions) {
    const row = headers.map(h => escapeCSV(q[h]));
    csvContent += row.join(',') + '\n';
  }
  
  fs.writeFileSync(path.join(targetDir, filename), csvContent, 'utf-8');
  console.log(`Saved ${filename} (${questions.length} questions)`);
}

const banks = {};

// ==========================================
// M1A: DISKON & HARGA AKHIR
// ==========================================
banks['M1A_DISKON_HARGA_AKHIR.csv'] = [
  // D1
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Sebuah baju seharga Rp 100.000 mendapat diskon 20%. Berapa rupiah besar diskon tersebut?',
    opt_a: 'Rp 10.000', opt_b: 'Rp 20.000', opt_c: 'Rp 80.000', opt_d: 'Rp 120.000', correct: 'B',
    hint1: 'Ingat rumus: Besar Diskon = Persentase Diskon × Harga Awal.',
    hint2: 'Kalikan 20/100 dengan Rp 100.000.',
    hint3: 'Bagi 100.000 dengan 100, lalu kalikan 20.',
    explanation: 'Besar diskon = 20% × Rp 100.000 = (20/100) × 100.000 = Rp 20.000.',
    remedial_material_id: 'R1_OPERASI_PERSEN_DASAR'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Harga sepasang sepatu adalah Rp 300.000. Toko memberikan diskon sebesar 15%. Berapakah harga sepatu setelah dipotong diskon?',
    opt_a: 'Rp 45.000', opt_b: 'Rp 255.000', opt_c: 'Rp 285.000', opt_d: 'Rp 345.000', correct: 'B',
    hint1: 'Harga Akhir = Harga Awal - Besar Diskon.',
    hint2: 'Hitung dulu diskonnya (15% dari Rp 300.000).',
    hint3: 'Diskonnya Rp 45.000. Kurangi harga awal dengan angka ini.',
    explanation: 'Besar diskon = 15% × Rp 300.000 = Rp 45.000. Harga akhir = Rp 300.000 - Rp 45.000 = Rp 255.000.',
    remedial_material_id: 'M1A_DISKON_HARGA_AKHIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 1, question_type: 'PG',
    question: 'Sebuah tas dijual dengan harga akhir Rp 80.000 setelah mendapat potongan Rp 20.000. Berapakah harga awal tas tersebut sebelum diskon?',
    opt_a: 'Rp 60.000', opt_b: 'Rp 80.000', opt_c: 'Rp 100.000', opt_d: 'Rp 120.000', correct: 'C',
    hint1: 'Harga Awal = Harga Akhir + Besar Diskon.',
    hint2: 'Tambahkan Rp 80.000 dengan potongan Rp 20.000.',
    hint3: '80.000 + 20.000 = ?',
    explanation: 'Harga Awal = Harga Akhir + Diskon = Rp 80.000 + Rp 20.000 = Rp 100.000.',
    remedial_material_id: 'M1A_DISKON_HARGA_AKHIR'
  },
  // D2
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 2, question_type: 'PG',
    question: 'Setelah didiskon 20%, harga sebuah buku menjadi Rp 40.000. Berapakah harga buku tersebut sebelum didiskon?',
    opt_a: 'Rp 48.000', opt_b: 'Rp 50.000', opt_c: 'Rp 60.000', opt_d: 'Rp 80.000', correct: 'B',
    hint1: 'Harga akhir (Rp 40.000) mencerminkan 80% dari harga awal.',
    hint2: 'Jika 80% = Rp 40.000, maka 100% = ?',
    hint3: 'Gunakan perbandingan: (100 / 80) × Rp 40.000.',
    explanation: 'Harga akhir adalah 100% - 20% = 80%. Harga awal = (100/80) × Rp 40.000 = Rp 50.000.',
    remedial_material_id: 'M1A_DISKON_HARGA_AKHIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 2, question_type: 'PG',
    question: 'Toko A menjual kemeja seharga Rp 100.000 dengan diskon 30%. Toko B menjual kemeja yang sama seharga Rp 90.000 dengan diskon 20%. Toko mana yang lebih murah dan berapa selisih harga akhirnya?',
    opt_a: 'Toko A, selisih Rp 2.000', opt_b: 'Toko B, selisih Rp 2.000', opt_c: 'Toko A, selisih Rp 10.000', opt_d: 'Harga keduanya sama', correct: 'A',
    hint1: 'Hitung harga akhir di masing-masing toko terlebih dahulu.',
    hint2: 'Toko A: 70% dari 100.000. Toko B: 80% dari 90.000.',
    hint3: 'Harga Toko A = Rp 70.000. Harga Toko B = Rp 72.000. Bandingkan!',
    explanation: 'Toko A = Rp 100.000 - Rp 30.000 = Rp 70.000. Toko B = Rp 90.000 - Rp 18.000 = Rp 72.000. Toko A lebih murah Rp 2.000.',
    remedial_material_id: 'M1A_DISKON_HARGA_AKHIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 2, question_type: 'PG',
    question: 'Langkah manakah yang paling cepat untuk menghitung harga sebuah jaket seharga Rp 150.000 yang didiskon 25%?',
    opt_a: 'Membagi 150.000 dengan 25', opt_b: 'Mengalikan 150.000 dengan 0.25', opt_c: 'Mengalikan 150.000 dengan 0.75', opt_d: 'Mengurangi 150.000 dengan 25.000', correct: 'C',
    hint1: 'Harga akhir adalah sisa dari persentase diskon.',
    hint2: 'Sisa persentase = 100% - 25% = 75%.',
    hint3: '75% sama dengan bentuk desimal 0.75.',
    explanation: 'Diskon 25% berarti kita hanya membayar 75% dari harga awal. 75% = 0.75, sehingga cukup kalikan harga dengan 0.75.',
    remedial_material_id: 'R1_OPERASI_PERSEN_DASAR'
  },
  // D3
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 3, question_type: 'PG',
    question: 'Toko memberikan promo "Diskon 50% + 20%". Jika Budi membeli barang seharga Rp 200.000, berapakah harga yang harus dibayar Budi?',
    opt_a: 'Rp 60.000', opt_b: 'Rp 80.000', opt_c: 'Rp 100.000', opt_d: 'Rp 140.000', correct: 'B',
    hint1: 'Diskon bertingkat (50% + 20%) TIDAK SAMA dengan diskon 70%.',
    hint2: 'Hitung dulu diskon 50%, lalu harga hasilnya didiskon lagi 20%.',
    hint3: 'Setelah 50%, harga menjadi Rp 100.000. Diskonkan 20% dari Rp 100.000 tersebut.',
    explanation: 'Diskon pertama (50%) membuat harga menjadi Rp 100.000. Diskon kedua (20%) dihitung dari Rp 100.000, yaitu Rp 20.000. Harga akhir = 100.000 - 20.000 = Rp 80.000.',
    remedial_material_id: 'M1A_DISKON_HARGA_AKHIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 3, question_type: 'PG',
    question: 'Siti melihat sebuah tas didiskon 80%. Siti berpikir, "Ah, aku hanya perlu membayar 1/4 dari harga asli". Apakah pemikiran Siti benar secara matematis?',
    opt_a: 'Benar, karena 100% - 80% = 20%, dan 20% itu 1/4', opt_b: 'Salah, karena 20% itu setara dengan 1/5', opt_c: 'Benar, karena 80% setara dengan 4/5', opt_d: 'Salah, karena 80% itu setara dengan 1/2', correct: 'B',
    hint1: 'Harga yang dibayar adalah sisa dari 100% dikurangi 80%.',
    hint2: 'Sisa persentase = 20%. Ubah 20% ke pecahan biasa.',
    hint3: '20% = 20/100. Sederhanakan pecahan tersebut.',
    explanation: 'Sisa harga yang dibayar adalah 20%. Secara pecahan, 20/100 = 1/5, bukan 1/4. Jadi pemikiran Siti salah.',
    remedial_material_id: 'R1_OPERASI_PERSEN_DASAR'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 3, question_type: 'PG',
    question: 'Untuk barang seharga Rp 50.000 per unit, manakah promo yang lebih menguntungkan jika kamu ingin membeli 3 barang: "Beli 2 Gratis 1" atau "Diskon 30% untuk seluruh pembelian"?',
    opt_a: 'Beli 2 Gratis 1 lebih hemat Rp 5.000', opt_b: 'Diskon 30% lebih hemat Rp 5.000', opt_c: 'Keduanya menghasilkan harga yang sama', opt_d: 'Beli 2 Gratis 1 lebih hemat Rp 15.000', correct: 'A',
    hint1: 'Hitung total bayar Promo 1 (Beli 2 Gratis 1) untuk 3 barang.',
    hint2: 'Hitung total bayar Promo 2 (Diskon 30% dari 3 barang).',
    hint3: 'Promo 1: bayar 2 barang (100rb). Promo 2: bayar 70% dari 150rb (105rb).',
    explanation: 'Promo "Beli 2 Gratis 1" = bayar 2 x 50.000 = Rp 100.000. Promo "Diskon 30%" = 70% x (3 x 50.000) = Rp 105.000. Promo pertama lebih hemat Rp 5.000.',
    remedial_material_id: 'M1A_DISKON_HARGA_AKHIR'
  }
];

// ==========================================
// M1B: PPN, BIAYA LAYANAN, ONGKIR
// ==========================================
banks['M1B_PPN_BIAYA_LAYANAN_ONGKIR.csv'] = [
  // D1
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Makanan seharga Rp 100.000 didiskon 20%, namun dikenakan PPN 11%. PPN dihitung DARI harga SETELAH diskon. Berapa total bayarnya?',
    opt_a: 'Rp 80.000', opt_b: 'Rp 88.800', opt_c: 'Rp 91.000', opt_d: 'Rp 111.000', correct: 'B',
    hint1: 'Hitung dulu harga setelah diskon.',
    hint2: 'Harga setelah diskon adalah Rp 80.000. Lalu hitung 11% dari Rp 80.000.',
    hint3: 'PPN = Rp 8.800. Tambahkan ke harga setelah diskon.',
    explanation: 'Harga setelah diskon = Rp 80.000. PPN = 11% x 80.000 = Rp 8.800. Total = 80.000 + 8.800 = Rp 88.800.',
    remedial_material_id: 'M1B_PPN_BIAYA_LAYANAN_ONGKIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Andi memesan taksi online seharga Rp 40.000. Aplikasi menambahkan biaya layanan sebesar Rp 2.000. Berapa total yang harus dibayar?',
    opt_a: 'Rp 38.000', opt_b: 'Rp 40.000', opt_c: 'Rp 42.000', opt_d: 'Rp 44.000', correct: 'C',
    hint1: 'Biaya layanan bersifat MENAMBAH total bayar.',
    hint2: 'Jumlahkan tarif dasar dengan biaya layanan.',
    hint3: '40.000 + 2.000.',
    explanation: 'Total = Tarif + Biaya Layanan = Rp 40.000 + Rp 2.000 = Rp 42.000.',
    remedial_material_id: 'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH'
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Budi belanja baju Rp 150.000 dan dikenakan ongkos kirim Rp 15.000. Berapa total uang yang dikeluarkan Budi?',
    opt_a: 'Rp 135.000', opt_b: 'Rp 150.000', opt_c: 'Rp 160.000', opt_d: 'Rp 165.000', correct: 'D',
    hint1: 'Ongkos kirim ditambahkan ke total belanja.',
    hint2: '150.000 + 15.000.',
    hint3: 'Cukup jumlahkan.',
    explanation: 'Total = Belanja + Ongkir = Rp 150.000 + Rp 15.000 = Rp 165.000.',
    remedial_material_id: 'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH'
  },
  // D2
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 2, question_type: 'PG',
    question: 'Harga makanan Rp 50.000. Ada biaya layanan restoran 5%. Berapa total yang harus dibayar?',
    opt_a: 'Rp 50.000', opt_b: 'Rp 52.500', opt_c: 'Rp 55.000', opt_d: 'Rp 60.000', correct: 'B',
    hint1: 'Hitung dulu 5% dari Rp 50.000.',
    hint2: '5% x 50.000 = 2.500.',
    hint3: 'Tambahkan hasil tersebut ke harga awal makanan.',
    explanation: 'Biaya layanan = 5% x 50.000 = 2.500. Total = 50.000 + 2.500 = Rp 52.500.',
    remedial_material_id: 'M1B_PPN_BIAYA_LAYANAN_ONGKIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 2, question_type: 'PG',
    question: 'Pesanan Rp 200.000. Ongkir Rp 20.000. Diskon 10% HANYA untuk pesanan. Berapa total bayar?',
    opt_a: 'Rp 198.000', opt_b: 'Rp 200.000', opt_c: 'Rp 218.000', opt_d: 'Rp 220.000', correct: 'B',
    hint1: 'Diskon 10% hanya memotong harga pesanan Rp 200.000, bukan ongkir.',
    hint2: 'Harga pesanan setelah diskon = 90% x 200.000 = Rp 180.000.',
    hint3: 'Tambahkan harga pesanan baru tersebut dengan ongkir Rp 20.000.',
    explanation: 'Diskon = 10% x 200.000 = 20.000. Pesanan menjadi 180.000. Total = 180.000 + Ongkir 20.000 = Rp 200.000.',
    remedial_material_id: 'M1B_PPN_BIAYA_LAYANAN_ONGKIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 2, question_type: 'PG',
    question: 'Siti membeli laptop secara online. Ia mendapat instruksi: Harga Dasar + Ongkir + PPN 11% (PPN dihitung dari Harga Dasar saja). Urutan mana yang benar untuk totalnya?',
    opt_a: 'Total = Harga Dasar + (11% x Harga Dasar) + Ongkir', opt_b: 'Total = (Harga Dasar + Ongkir) x 11%', opt_c: 'Total = Harga Dasar x Ongkir x 11%', opt_d: 'Total = (Harga Dasar + Ongkir) - 11%', correct: 'A',
    hint1: 'PPN dihitung HANYA dari Harga Dasar.',
    hint2: 'Jadi nilai PPN adalah (11% x Harga Dasar).',
    hint3: 'Ongkir bersifat penambahan tetap setelah PPN dihitung.',
    explanation: 'Karena PPN hanya dihitung dari harga dasar, rumusnya adalah Total = Harga Dasar + PPN + Ongkir, atau Harga Dasar + (11% x Harga Dasar) + Ongkir.',
    remedial_material_id: 'R1_OPERASI_PERSEN_DASAR'
  },
  // D3
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 3, question_type: 'PG',
    question: 'Toko A: Harga Rp 100.000, Ongkir Rp 30.000. Toko B: Harga Rp 115.000, Gratis Ongkir. Toko mana yang totalnya lebih hemat dan selisihnya?',
    opt_a: 'Toko A, selisih Rp 15.000', opt_b: 'Toko B, selisih Rp 15.000', opt_c: 'Toko A, selisih Rp 5.000', opt_d: 'Toko B, selisih Rp 5.000', correct: 'B',
    hint1: 'Hitung total bayar di Toko A: Harga + Ongkir.',
    hint2: 'Total Toko A = Rp 130.000. Total Toko B = Rp 115.000.',
    hint3: 'Bandingkan dan cari selisih dari 130.000 - 115.000.',
    explanation: 'Total A = 100.000 + 30.000 = 130.000. Total B = 115.000 + 0 = 115.000. Toko B lebih murah dengan selisih 15.000.',
    remedial_material_id: 'M1B_PPN_BIAYA_LAYANAN_ONGKIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 3, question_type: 'PG',
    question: 'Daftar tagihan: Harga barang Rp 400.000, Diskon 25%, PPN 10% (dari harga setelah diskon), Asuransi tetap Rp 10.000. Berapa total bayar?',
    opt_a: 'Rp 310.000', opt_b: 'Rp 340.000', opt_c: 'Rp 410.000', opt_d: 'Rp 440.000', correct: 'B',
    hint1: 'Langkah 1: Diskon 25% dari 400.000 = 100.000. Harga baru = 300.000.',
    hint2: 'Langkah 2: PPN 10% dari 300.000 = 30.000.',
    hint3: 'Langkah 3: Jumlahkan Harga Baru + PPN + Asuransi.',
    explanation: 'Setelah diskon: 300.000. Tambah PPN 10%: 300.000 + 30.000 = 330.000. Tambah Asuransi: 330.000 + 10.000 = 340.000.',
    remedial_material_id: 'M1B_PPN_BIAYA_LAYANAN_ONGKIR'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 3, question_type: 'PG',
    question: 'Sebuah struk menunjukkan total Rp 132.000 (sudah termasuk PPN 10% dan biaya admin Rp 11.000). Berapakah harga dasar barang murni (sebelum PPN dan biaya admin)?',
    opt_a: 'Rp 100.000', opt_b: 'Rp 110.000', opt_c: 'Rp 120.000', opt_d: 'Rp 121.000', correct: 'B',
    hint1: 'Pertama, kurangi total dengan biaya admin tetap (Rp 11.000).',
    hint2: 'Sisa Rp 121.000 adalah (Harga Dasar + PPN 10%). Artinya Rp 121.000 = 110% dari Harga Dasar.',
    hint3: 'Gunakan perbandingan: (100 / 110) × 121.000.',
    explanation: 'Kurangi biaya admin: 132.000 - 11.000 = 121.000. Karena 121.000 mengandung PPN 10%, maka Harga Dasar = 121.000 / 1.1 = Rp 110.000.',
    remedial_material_id: 'M1B_PPN_BIAYA_LAYANAN_ONGKIR'
  }
];

// ==========================================
// M1C: UNTUNG & RUGI (PERSENTASE)
// ==========================================
banks['M1C_UNTUNG_RUGI_PERSENTASE.csv'] = [
  // D1
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Budi membeli sepeda Rp 500.000 lalu menjualnya Rp 600.000. Berapa besar keuntungan Budi?',
    opt_a: 'Rp 50.000', opt_b: 'Rp 100.000', opt_c: 'Rp 600.000', opt_d: 'Rp 1.100.000', correct: 'B',
    hint1: 'Untung = Harga Jual - Harga Beli.',
    hint2: '600.000 - 500.000.',
    hint3: 'Hasilnya selisih positif antara jual dan beli.',
    explanation: 'Untung = Harga Jual - Harga Beli = Rp 600.000 - Rp 500.000 = Rp 100.000.',
    remedial_material_id: 'M1C_UNTUNG_RUGI_PERSENTASE'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Harga beli pensil Rp 2.000, dijual untung Rp 500. Berapakah persentase untungnya terhadap harga beli?',
    opt_a: '10%', opt_b: '20%', opt_c: '25%', opt_d: '50%', correct: 'C',
    hint1: 'Persen Untung = (Besar Untung / Harga Beli) × 100%.',
    hint2: '(500 / 2.000) × 100%.',
    hint3: '500 dibagi 2000 adalah 1/4.',
    explanation: 'Persen Untung = (500 / 2.000) × 100% = 1/4 × 100% = 25%.',
    remedial_material_id: 'R1_OPERASI_PERSEN_DASAR'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 1, question_type: 'PG',
    question: 'Pedagang beli mangga Rp 20.000/kg. Ternyata banyak yang busuk sehingga terpaksa dijual Rp 15.000/kg. Apakah pedagang untung atau rugi, dan berapa?',
    opt_a: 'Untung Rp 5.000', opt_b: 'Untung Rp 15.000', opt_c: 'Rugi Rp 5.000', opt_d: 'Rugi Rp 15.000', correct: 'C',
    hint1: 'Harga Jual lebih kecil dari Harga Beli, maka terjadi Kerugian.',
    hint2: 'Rugi = Harga Beli - Harga Jual.',
    hint3: '20.000 - 15.000 = rugi 5.000.',
    explanation: 'Karena Jual < Beli, terjadi rugi. Rugi = 20.000 - 15.000 = Rp 5.000.',
    remedial_material_id: 'M1C_UNTUNG_RUGI_PERSENTASE'
  },
  // D2
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 2, question_type: 'PG',
    question: 'Harga beli modal tas adalah Rp 80.000. Penjual ingin untung 20%. Harga jual yang harus dipasang adalah?',
    opt_a: 'Rp 88.000', opt_b: 'Rp 96.000', opt_c: 'Rp 100.000', opt_d: 'Rp 120.000', correct: 'B',
    hint1: 'Hitung dulu 20% dari Rp 80.000.',
    hint2: '20% x 80.000 = 16.000.',
    hint3: 'Harga Jual = Harga Modal + Besar Untung.',
    explanation: 'Untung = 20% x 80.000 = 16.000. Harga Jual = 80.000 + 16.000 = Rp 96.000.',
    remedial_material_id: 'M1C_UNTUNG_RUGI_PERSENTASE'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 2, question_type: 'PG',
    question: 'Membeli saham seharga Rp 1.000.000 dan dijual rugi menjadi Rp 850.000. Berapa persen persentase kerugiannya?',
    opt_a: '10%', opt_b: '15%', opt_c: '20%', opt_d: '25%', correct: 'B',
    hint1: 'Hitung besar kerugian: 1.000.000 - 850.000.',
    hint2: 'Rugi = Rp 150.000.',
    hint3: 'Persen Rugi = (150.000 / 1.000.000) × 100%.',
    explanation: 'Rugi = 1.000.000 - 850.000 = 150.000. Persentase = (150.000/1.000.000) × 100% = 15%.',
    remedial_material_id: 'M1C_UNTUNG_RUGI_PERSENTASE'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 2, question_type: 'PG',
    question: 'Toko A beli barang Rp 100rb jual Rp 120rb. Toko B beli barang Rp 50rb jual Rp 65rb. Toko mana yang persentase keuntungannya lebih tinggi?',
    opt_a: 'Toko A (20%)', opt_b: 'Toko B (30%)', opt_c: 'Keduanya sama', opt_d: 'Toko A (30%)', correct: 'B',
    hint1: 'Hitung persen untung Toko A: (20.000/100.000) x 100%.',
    hint2: 'Hitung persen untung Toko B: (15.000/50.000) x 100%.',
    hint3: 'Toko A = 20%. Toko B = 30%.',
    explanation: 'Untung A = 20/100 = 20%. Untung B = 15/50 = 30/100 = 30%. Toko B persentasenya lebih tinggi.',
    remedial_material_id: 'R3_PEMBAGIAN_DAN_HARGA_PER_UNIT'
  },
  // D3
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 3, question_type: 'PG',
    question: 'Seorang pedagang membeli 5 kg telur total Rp 100.000. Ia ingin margin keuntungan total 25%. Berapakah harga jual per kg telur tersebut?',
    opt_a: 'Rp 20.000', opt_b: 'Rp 25.000', opt_c: 'Rp 30.000', opt_d: 'Rp 35.000', correct: 'B',
    hint1: 'Harga Beli per kg = 100.000 / 5 = Rp 20.000.',
    hint2: 'Dia ingin untung 25% dari Harga Beli per kg tersebut.',
    hint3: 'Keuntungan per kg = 25% x 20.000 = Rp 5.000. Tambahkan ke modal per kg.',
    explanation: 'Modal/kg = Rp 20.000. Untung yang diharap = 25% x 20.000 = Rp 5.000. Harga Jual/kg = 20.000 + 5.000 = Rp 25.000.',
    remedial_material_id: 'R3_PEMBAGIAN_DAN_HARGA_PER_UNIT'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 3, question_type: 'PG',
    question: 'Barang dijual Rp 120.000 dengan catatan tertulis "Sudah Untung 20%". Berapakah harga modal barang tersebut?',
    opt_a: 'Rp 96.000', opt_b: 'Rp 100.000', opt_c: 'Rp 144.000', opt_d: 'Rp 150.000', correct: 'B',
    hint1: 'Harga Jual Rp 120.000 adalah setara 120% dari Harga Modal.',
    hint2: 'Gunakan perbandingan: (100% / 120%) × Harga Jual.',
    hint3: '(100 / 120) × 120.000 = ?',
    explanation: 'Harga Jual mengandung untung 20%, jadi setara 120% modal. Modal = (100/120) x 120.000 = Rp 100.000.',
    remedial_material_id: 'M1C_UNTUNG_RUGI_PERSENTASE'
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 3, question_type: 'PG',
    question: 'Andi beli 10 lusin buku seharga total Rp 120.000. Ternyata 20 buku rusak. Sisanya ia jual Rp 1.500 per buku. Apakah hasilnya?',
    opt_a: 'Untung Rp 30.000', opt_b: 'Rugi Rp 30.000', opt_c: 'Untung Rp 150.000', opt_d: 'Rugi Rp 20.000', correct: 'A',
    hint1: '1 lusin = 12 buah. Jadi ada 120 buku. Rusak 20, sisa 100 buku untuk dijual.',
    hint2: 'Omzet Jual = 100 buku x Rp 1.500 = Rp 150.000.',
    hint3: 'Bandingkan Omzet (150.000) dengan Modal awal (120.000).',
    explanation: 'Buku layak jual = 120 - 20 = 100 buku. Omzet = 100 x 1.500 = 150.000. Modal = 120.000. Untung = 150.000 - 120.000 = Rp 30.000.',
    remedial_material_id: 'R3_PEMBAGIAN_DAN_HARGA_PER_UNIT'
  }
];

// ==========================================
// M1D: BUNGA SEDERHANA
// ==========================================
banks['M1D_BUNGA_SEDERHANA.csv'] = [
  // D1
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Ayah menabung Rp 1.000.000 di bank dengan bunga 10% per tahun. Berapa rupiah bunga yang didapat setelah 1 tahun?',
    opt_a: 'Rp 10.000', opt_b: 'Rp 50.000', opt_c: 'Rp 100.000', opt_d: 'Rp 110.000', correct: 'C',
    hint1: 'Bunga = Modal × Persentase.',
    hint2: '10% x 1.000.000.',
    hint3: '10 dibagi 100, lalu dikali sejuta.',
    explanation: 'Bunga = 10% x 1.000.000 = Rp 100.000.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Menabung Rp 500.000, bunga tahunan 12%. Berapa total tabungan setelah 1 tahun?',
    opt_a: 'Rp 512.000', opt_b: 'Rp 560.000', opt_c: 'Rp 600.000', opt_d: 'Rp 620.000', correct: 'B',
    hint1: 'Hitung dulu bunganya (12% dari 500.000).',
    hint2: 'Bunga = Rp 60.000.',
    hint3: 'Tambahkan bunga ke modal awal.',
    explanation: 'Bunga = 12% x 500.000 = 60.000. Total = 500.000 + 60.000 = Rp 560.000.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Bunga per tahun 12%. Berapa persentase bunga untuk waktu 6 bulan?',
    opt_a: '6%', opt_b: '12%', opt_c: '24%', opt_d: '2%', correct: 'A',
    hint1: '1 tahun ada 12 bulan.',
    hint2: '6 bulan adalah setengah dari 1 tahun.',
    hint3: 'Bagi 12% dengan 2.',
    explanation: 'Bunga proporsional 6 bulan = (6/12) x 12% = 6%.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  },
  // D2
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 2, question_type: 'PG',
    question: 'Pilih opsi menabung: A) Bank X bunga 12% per tahun tapi dipotong admin Rp 20.000/tahun. B) Bank Y bunga 10% tanpa potongan. Jika modal Rp 2.000.000, pilih mana?',
    opt_a: 'Bank X (hasil 2.220.000)', opt_b: 'Bank Y (hasil 2.200.000)', opt_c: 'Bank X (hasil 2.240.000)', opt_d: 'Bank Y (hasil 2.240.000)', correct: 'A',
    hint1: 'Hitung Bank X: Bunga 12% dari 2jt = 240.000. Kurangi admin 20.000.',
    hint2: 'Hasil bersih bunga Bank X = 220.000. Total tabungan = 2.220.000.',
    hint3: 'Hitung Bank Y: Bunga 10% dari 2jt = 200.000. Total = 2.200.000. Bank X lebih besar.',
    explanation: 'Bank X bersih = (12% x 2jt) - 20rb = 220rb. Total X = 2.220.000. Bank Y = 10% x 2jt = 200rb. Total Y = 2.200.000. Bank X lebih menguntungkan.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 2, question_type: 'PG',
    question: 'Pinjam Rp 5.000.000 dengan bunga 1% per bulan. Total uang yang harus dikembalikan jika meminjam selama 5 bulan adalah?',
    opt_a: 'Rp 5.050.000', opt_b: 'Rp 5.250.000', opt_c: 'Rp 5.500.000', opt_d: 'Rp 7.500.000', correct: 'B',
    hint1: 'Bunga 1 bulan = 1% x 5.000.000 = Rp 50.000.',
    hint2: 'Karena 5 bulan, total bunga = 5 x 50.000 = Rp 250.000.',
    hint3: 'Total pengembalian = Pokok + Total Bunga.',
    explanation: 'Bunga 5 bulan = 5 x 1% x 5.000.000 = Rp 250.000. Total kembalian = 5.000.000 + 250.000 = Rp 5.250.000.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 2, question_type: 'PG',
    question: 'Siti ingin hasil bunganya saja mencapai Rp 120.000 dalam setahun. Jika bank memberi bunga 6% per tahun, berapa uang yang harus Siti tabung?',
    opt_a: 'Rp 720.000', opt_b: 'Rp 1.000.000', opt_c: 'Rp 1.200.000', opt_d: 'Rp 2.000.000', correct: 'D',
    hint1: 'Rumus bunga: Bunga = Modal × Bunga Tahunan.',
    hint2: '120.000 = Modal × 6%.',
    hint3: 'Modal = 120.000 / (6/100) = (120.000 x 100) / 6.',
    explanation: 'Modal = Bunga yang diinginkan / Persentase = 120.000 / 0.06 = Rp 2.000.000.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  },
  // D3
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 3, question_type: 'PG',
    question: 'Meminjam Rp 12.000.000 di Koperasi dengan bunga 1.5% per bulan. Ingin dicicil selama 10 bulan. Berapa besar cicilan per bulan yang harus dibayar?',
    opt_a: 'Rp 1.200.000', opt_b: 'Rp 1.350.000', opt_c: 'Rp 1.380.000', opt_d: 'Rp 1.500.000', correct: 'C',
    hint1: 'Hitung total bunga 10 bulan: 10 x 1.5% x 12.000.000 = 1.800.000.',
    hint2: 'Total utang = Pokok + Total Bunga = 13.800.000.',
    hint3: 'Bagi Total utang dengan 10 bulan.',
    explanation: 'Total bunga = 10 x 0.015 x 12jt = 1.8jt. Total hutang = 13.8jt. Cicilan per bulan = 13.8jt / 10 = Rp 1.380.000.',
    remedial_material_id: 'R3_PEMBAGIAN_DAN_HARGA_PER_UNIT'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 3, question_type: 'PG',
    question: 'Andi meminjam 1 juta. Seminggu kemudian rentenir menagih 1.2 juta dan disebut "Bunga ringan". Berapa % sebenarnya bunga per bulan jika diasumsikan 1 bulan=4 minggu?',
    opt_a: '2%', opt_b: '20%', opt_c: '80%', opt_d: '120%', correct: 'C',
    hint1: 'Bunga 1 minggu = 1.200.000 - 1.000.000 = 200.000.',
    hint2: 'Persentase bunga per minggu = (200.000 / 1.000.000) = 20%.',
    hint3: 'Jika 1 minggu 20%, maka 4 minggu (1 bulan) = 4 x 20%.',
    explanation: 'Bunga sepekan 200rb (20% dari 1jt). Jika diproyeksikan 1 bulan (4 pekan), maka bunganya 4 x 20% = 80% per bulan. Sangat mencekik.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 3, question_type: 'PG',
    question: 'Tabungan awal Rp 4.000.000. Bunga 9% per tahun. Setelah berapa bulan tabungan menjadi Rp 4.150.000?',
    opt_a: '4 bulan', opt_b: '5 bulan', opt_c: '6 bulan', opt_d: '8 bulan', correct: 'B',
    hint1: 'Bunga yang didapat = Rp 150.000.',
    hint2: 'Bunga penuh 1 tahun (12 bulan) = 9% x 4.000.000 = Rp 360.000.',
    hint3: 'Gunakan perbandingan: (Waktu/12) x 360.000 = 150.000.',
    explanation: 'Bunga tahunan = Rp 360.000. Bunga dicapai = Rp 150.000. Waktu = (150.000 / 360.000) x 12 bulan = 5 bulan.',
    remedial_material_id: 'M1D_BUNGA_SEDERHANA'
  }
];

// ==========================================
// M1E: BRUTO, NETO, TARA
// ==========================================
banks['M1E_BRUTO_NETO_TARA.csv'] = [
  // D1
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Sekarung beras memiliki Bruto 50 kg. Berat karungnya (Tara) 1 kg. Berapa Neto (berat bersih) beras tersebut?',
    opt_a: '49 kg', opt_b: '50 kg', opt_c: '51 kg', opt_d: '50.1 kg', correct: 'A',
    hint1: 'Neto = Bruto - Tara.',
    hint2: 'Neto adalah berat isi murni.',
    hint3: '50 kg dikurangi 1 kg.',
    explanation: 'Neto = Bruto - Tara = 50 - 1 = 49 kg.',
    remedial_material_id: 'M1E_BRUTO_NETO_TARA'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 1, question_type: 'PG',
    question: 'Berat isi biskuit (Neto) adalah 250 gram. Ditimbang dengan kemasan total (Bruto) jadi 265 gram. Berapakah Taranya?',
    opt_a: '10 gram', opt_b: '15 gram', opt_c: '25 gram', opt_d: '515 gram', correct: 'B',
    hint1: 'Tara = Bruto - Neto.',
    hint2: 'Tara adalah berat kemasan pembungkus.',
    hint3: '265 gram dikurangi 250 gram.',
    explanation: 'Tara = Bruto - Neto = 265 - 250 = 15 gram.',
    remedial_material_id: 'M1E_BRUTO_NETO_TARA'
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Istilah untuk "Berat kemasan pembungkus tanpa isinya" adalah?',
    opt_a: 'Bruto', opt_b: 'Neto', opt_c: 'Tara', opt_d: 'Diskon', correct: 'C',
    hint1: 'Bruto = Kotor. Neto = Bersih.',
    hint2: 'Bagian yang dibuang/menyusut disebut Tara.',
    hint3: 'Tara adalah berat wadah.',
    explanation: 'Tara adalah istilah matematika untuk berat wadah atau kemasan kosong.',
    remedial_material_id: 'M1E_BRUTO_NETO_TARA'
  },
  // D2
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 2, question_type: 'PG',
    question: 'Sekotak apel Bruto 20 kg. Tertera "Tara 5%". Berapakah berat Taranya dalam kg?',
    opt_a: '0.5 kg', opt_b: '1 kg', opt_c: '2 kg', opt_d: '5 kg', correct: 'B',
    hint1: 'Persen Tara dihitung dari berat Bruto.',
    hint2: 'Hitung 5% dari 20 kg.',
    hint3: '(5/100) x 20 = ?',
    explanation: 'Tara = 5% x 20 kg = 1 kg.',
    remedial_material_id: 'R1_OPERASI_PERSEN_DASAR'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 2, question_type: 'PG',
    question: 'Satu botol minuman: Neto 1.5 kg, Tara 500 gram. Berapa Bruto dalam kg?',
    opt_a: '2 kg', opt_b: '1.55 kg', opt_c: '6.5 kg', opt_d: '1501 kg', correct: 'A',
    hint1: 'Samakan satuan terlebih dahulu. 500 gram = 0.5 kg.',
    hint2: 'Bruto = Neto + Tara.',
    hint3: '1.5 kg + 0.5 kg.',
    explanation: 'Ubah gram ke kg: 500g = 0.5kg. Bruto = Neto + Tara = 1.5 + 0.5 = 2 kg.',
    remedial_material_id: 'M1E_BRUTO_NETO_TARA'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 2, question_type: 'PG',
    question: 'Kopi bubuk kemasan saset: tertulis Neto 20g. Ditimbang dengan bungkus plastiknya ternyata 21g. Jika persen tara melebihi 10%, produk ditarik. Apakah ditarik?',
    opt_a: 'Ya, karena Tara 5%', opt_b: 'Tidak, karena Tara 5%', opt_c: 'Ya, karena Tara 20%', opt_d: 'Tidak, karena Tara 20%', correct: 'B',
    hint1: 'Bruto = 21g. Neto = 20g. Berapa Tara-nya?',
    hint2: 'Tara = 1g. Persentase Tara = (Tara / Bruto) x 100%.',
    hint3: '(1 / 21) x 100% ≈ 4.76%.',
    explanation: 'Tara = 21 - 20 = 1g. Persen Tara = (1/21)x100% = 4.76%. Karena di bawah 10%, maka aman (Tidak ditarik).',
    remedial_material_id: 'M1E_BRUTO_NETO_TARA'
  },
  // D3
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 3, question_type: 'PG',
    question: 'Pedagang membeli 2 karung gula pasir, Bruto masing-masing 50 kg dan Tara 2%. Jika harga gula Rp 15.000/kg (dibayar hanya untuk netonya), berapa total modal pembeliannya?',
    opt_a: 'Rp 1.470.000', opt_b: 'Rp 1.500.000', opt_c: 'Rp 1.530.000', opt_d: 'Rp 2.940.000', correct: 'A',
    hint1: 'Total Bruto = 2 x 50 kg = 100 kg. Hitung Tara total: 2% dari 100 kg.',
    hint2: 'Tara = 2 kg. Maka Total Neto = 100 - 2 = 98 kg.',
    hint3: 'Kalikan Neto total (98 kg) dengan Rp 15.000.',
    explanation: 'Total Bruto = 100kg. Tara 2% = 2kg. Neto = 98kg. Modal = 98 x 15.000 = Rp 1.470.000.',
    remedial_material_id: 'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH'
  },
  {
    mode: 'PRACTICE', indicator: 'I2', difficulty: 3, question_type: 'PG',
    question: 'Diketahui Bruto = B, Neto = N, Tara = T. Rumus persentase Tara (%T) yang paling tepat secara matematis adalah?',
    opt_a: '%T = (T / N) x 100%', opt_b: '%T = (T / B) x 100%', opt_c: '%T = (N / B) x 100%', opt_d: '%T = (B / T) x 100%', correct: 'B',
    hint1: 'Tara selalu dihitung persentasenya relatif terhadap berat KESELURUHAN (Kotor).',
    hint2: 'Berat keseluruhan adalah Bruto.',
    hint3: 'Maka pembaginya harus B (Bruto).',
    explanation: 'Sesuai kesepakatan dagang internasional, persentase tara selalu dihitung berdasarkan Bruto. Jadi %T = (Tara / Bruto) x 100%.',
    remedial_material_id: 'M1E_BRUTO_NETO_TARA'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 3, question_type: 'PG',
    question: 'Peti buah jeruk A Bruto 30kg, Tara 2kg. Peti jeruk B Bruto 25kg, Tara 1kg. Peti mana yang persentase isi murninya (Neto) paling besar terhadap Bruto?',
    opt_a: 'Peti A (93.3%)', opt_b: 'Peti B (96%)', opt_c: 'Keduanya 94%', opt_d: 'Peti A (98%)', correct: 'B',
    hint1: 'Neto A = 28kg. %Neto A = (28/30) x 100%.',
    hint2: 'Neto B = 24kg. %Neto B = (24/25) x 100%.',
    hint3: 'Peti A ≈ 93.3%. Peti B = 96%.',
    explanation: 'Neto A = 30-2=28. Persentase = 28/30 = 93.3%. Neto B = 25-1=24. Persentase = 24/25 = 96%. Peti B lebih dominan isinya.',
    remedial_material_id: 'R1_OPERASI_PERSEN_DASAR'
  }
];

// ==========================================
// M1F: PROMO & PENGAMBILAN KEPUTUSAN
// ==========================================
banks['M1F_PROMO_TRANSAKSI_KEPUTUSAN.csv'] = [
  // D1
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 1, question_type: 'PG',
    question: 'Promo A: Diskon 50%. Promo B: Beli 1 Gratis 1. Untuk membeli 2 barang seharga Rp 10.000/pc, promo mana yang harus kamu pilih?',
    opt_a: 'Promo A', opt_b: 'Promo B', opt_c: 'Sama hematnya', opt_d: 'Tidak ada yang hemat', correct: 'C',
    hint1: 'Promo A: 2 barang Rp 20.000 didiskon 50% = bayar Rp 10.000.',
    hint2: 'Promo B: Beli 2 cukup bayar 1 = Rp 10.000.',
    hint3: 'Keduanya menghasilkan nominal bayar yang sama persis.',
    explanation: 'Diskon 50% untuk 2 barang (bayar separuh) secara matematis nilainya identik dengan Beli 2 bayar 1 (Beli 1 Gratis 1).',
    remedial_material_id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 1, question_type: 'PG',
    question: 'Promo Flash Sale: Diskon tetap Rp 15.000 tanpa minimal belanja. Barang A Rp 20.000. Barang B Rp 100.000. Diskon ini terasa paling menguntungkan (persentase besar) jika membeli?',
    opt_a: 'Barang A', opt_b: 'Barang B', opt_c: 'Sama saja', opt_d: 'Membeli keduanya bersamaan', correct: 'A',
    hint1: 'Bandingkan potongan Rp 15.000 terhadap modal awalnya.',
    hint2: 'Pada barang Rp 20.000, potongannya hampir gratis! (75%).',
    hint3: 'Pada barang 100.000, potongannya cuma 15%.',
    explanation: 'Diskon nominal (Rp 15.000) paling terasa persentasenya jika digunakan untuk membeli barang termurah. Untuk A = hemat 75%, untuk B = hemat 15%.',
    remedial_material_id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 1, question_type: 'PG',
    question: 'Berapa kira-kira uang minimal yang harus kamu siapkan jika ingin membeli barang Rp 99.000 dengan pajak 10% dan biaya parkir Rp 2.000?',
    opt_a: 'Rp 100.000', opt_b: 'Rp 105.000', opt_c: 'Rp 112.000', opt_d: 'Rp 120.000', correct: 'C',
    hint1: 'Pajak = 10% x 99.000 = Rp 9.900.',
    hint2: 'Jumlahkan 99.000 + 9.900 + 2.000.',
    hint3: 'Totalnya adalah 110.900. Minimal siapkan lembaran di atasnya.',
    explanation: 'Total = 99.000 + 9.900 + 2.000 = 110.900. Membawa 112.000 (atau kelipatan uang lebih tinggi) adalah estimasi rasional minimum terdekat.',
    remedial_material_id: 'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH'
  },
  // D2
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 2, question_type: 'PG',
    question: 'Keranjang berisi: 2 Sampo @Rp 15.000 dan 3 Sabun @Rp 10.000. Tersedia voucher potongan Rp 10.000. Total yang harus dibayar?',
    opt_a: 'Rp 40.000', opt_b: 'Rp 50.000', opt_c: 'Rp 60.000', opt_d: 'Rp 70.000', correct: 'B',
    hint1: 'Hitung total belanja kotor: (2x15.000) + (3x10.000).',
    hint2: 'Total kotor = 30.000 + 30.000 = 60.000.',
    hint3: 'Kurangi total kotor dengan potongan voucher 10.000.',
    explanation: 'Belanja kotor = 60.000. Setelah potong voucher 10.000, sisa = Rp 50.000.',
    remedial_material_id: 'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 2, question_type: 'PG',
    question: 'Metode bayar Cash: Rp 100.000 utuh. Metode E-Wallet: Diskon 20% tapi ada admin top-up Rp 2.000 dan PPN e-commerce 5%. Mana yang paling hemat?',
    opt_a: 'Cash (bayar 100rb)', opt_b: 'E-Wallet (bayar 82rb)', opt_c: 'E-Wallet (bayar 86rb)', opt_d: 'E-Wallet (bayar 87rb)', correct: 'C',
    hint1: 'E-Wallet: Harga didiskon 20% jadi 80.000.',
    hint2: 'PPN 5% dihitung dari 80.000 = 4.000. Tambahkan admin 2.000.',
    hint3: 'Total E-Wallet = 80.000 + 4.000 + 2.000 = 86.000. Lebih hemat dari 100.000.',
    explanation: 'Diskon 20% = harga jadi 80rb. PPN 5% dari 80rb = 4rb. Biaya = 80rb+4rb+2rb = Rp 86.000. E-Wallet jelas lebih hemat.',
    remedial_material_id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 2, question_type: 'PG',
    question: 'Melihat harga kulkas Rp 3.000.000, dicoret jadi Rp 2.990.000 dengan stiker merah besar "SUPER SALE". Ini adalah contoh dari...',
    opt_a: 'Diskon besar-besaran 10%', opt_b: 'Diskon yang signifikan >50%', opt_c: 'Trik marketing numerik (potongan kurang dari 1%)', opt_d: 'Trik menaikkan harga sebelum didiskon', correct: 'C',
    hint1: 'Hitung selisih harganya. Hanya Rp 10.000.',
    hint2: 'Cari persentase diskon: (10.000 / 3.000.000) x 100%.',
    hint3: 'Hasilnya 0.3%. Sangat kecil meski stikernya besar.',
    explanation: 'Diskonnya hanya Rp 10.000, yang mana (10/3000) x 100% = 0.33%. Ini murni trik psikologis *marketing* belaka.',
    remedial_material_id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN'
  },
  // D3
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 3, question_type: 'PG',
    question: 'Toko X: Diskon 40%, Min. belanja Rp 200rb, Max diskon Rp 30rb. Budi belanja barang Rp 250rb. Berapa total bayar Budi?',
    opt_a: 'Rp 150.000', opt_b: 'Rp 220.000', opt_c: 'Rp 250.000 (diskon gagal)', opt_d: 'Rp 200.000', correct: 'B',
    hint1: 'Cek syarat minimal belanja: 250.000 > 200.000 (Diskon berlaku!).',
    hint2: 'Hitung diskon 40% dari 250.000 = 100.000.',
    hint3: 'TETAPI, ada MAX diskon Rp 30.000. Jadi diskon yang didapat hanya mentok di 30.000.',
    explanation: 'Secara teori diskon = 40% x 250k = 100k. Namun karena Max Diskon = 30k, potongannya hanya Rp 30.000. Total = 250k - 30k = Rp 220.000.',
    remedial_material_id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN'
  },
  {
    mode: 'PRACTICE', indicator: 'I4', difficulty: 3, question_type: 'PG',
    question: 'Opsi A: Beli Laptop Rp 5jt cash. Opsi B: Cicilan 0% selama 12 bulan (Rp 416.666/bln) tapi wajib bayar admin di muka Rp 200.000. Manakah yang uang total keluarnya paling banyak?',
    opt_a: 'Opsi A', opt_b: 'Opsi B', opt_c: 'Keduanya sama persis', opt_d: 'Tergantung inflasi', correct: 'B',
    hint1: 'Total keluar Opsi A = 5.000.000.',
    hint2: 'Total keluar Opsi B = (12 x 416.666) + Admin 200.000.',
    hint3: 'Opsi B totalnya Rp 5.000.000 + Rp 200.000 = 5.200.000.',
    explanation: 'Opsi B secara riil meminta uang 5.200.000 (karena ada biaya admin 200.000 di luar bunga). Secara absolut angka, Opsi B lebih mahal.',
    remedial_material_id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN'
  },
  {
    mode: 'PRACTICE', indicator: 'I3', difficulty: 3, question_type: 'PG',
    question: 'Restoran All-You-Can-Eat mematok Rp 150.000/orang (waktu 90 menit). Budi makan setara 3 porsi ayam (harga normal Rp 30.000/porsi). Secara finansial, apakah keputusan makan AYCE Budi untung?',
    opt_a: 'Ya, karena makan sepuasnya menguntungkan', opt_b: 'Tidak, karena nilai makanan yang dimakan (Rp 90.000) < Biaya AYCE (Rp 150.000)', opt_c: 'Ya, karena 90 menit itu lama', opt_d: 'Seri/Impas', correct: 'B',
    hint1: 'Bandingkan nilai eceran makanan yang dikonsumsi dengan tiket masuk.',
    hint2: 'Nilai makanan = 3 porsi x Rp 30.000 = Rp 90.000.',
    hint3: 'Biaya keluar = Rp 150.000. Uang keluar > Nilai yang didapat.',
    explanation: 'Secara matematis, Budi rugi Rp 60.000 (150rb bayar - 90rb nilai makanan). AYCE baru menguntungkan jika konsumen makan porsi > nilai tiket.',
    remedial_material_id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN'
  }
];

// ==========================================
// R1: OPERASI PERSEN DASAR
// ==========================================
banks['R1_OPERASI_PERSEN_DASAR.csv'] = [
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Berapakah 10% dari Rp 50.000?',
    opt_a: 'Rp 500', opt_b: 'Rp 5.000', opt_c: 'Rp 10.000', opt_d: 'Rp 50.000', correct: 'B',
    hint1: '10% sama dengan 10/100.',
    hint2: 'Coret satu nol dari angka 50.000.',
    hint3: '50.000 dibagi 10 = 5.000.',
    explanation: '10% x 50.000 = (10/100) x 50.000 = Rp 5.000.',
    remedial_material_id: ''
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Pecahan desimal 0.25 sama dengan berapa persen?',
    opt_a: '2.5%', opt_b: '25%', opt_c: '250%', opt_d: '0.0025%', correct: 'B',
    hint1: 'Kalikan desimal dengan 100 untuk menjadikannya persen.',
    hint2: '0.25 x 100 = 25.',
    hint3: 'Hasilnya langsung diberi lambang %.',
    explanation: 'Persen berarti per-seratus. 0.25 = 25/100 = 25%.',
    remedial_material_id: ''
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Jika 50% = Setengah (1/2), maka 25% sama dengan pecahan?',
    opt_a: '1/3', opt_b: '1/4', opt_c: '1/5', opt_d: '1/8', correct: 'B',
    hint1: '25% adalah separuh dari 50%.',
    hint2: 'Separuh dari 1/2 adalah 1/4.',
    hint3: 'Bisa juga dihitung: 25/100 disederhanakan bagi 25.',
    explanation: '25% = 25/100. Dibagi FPB 25 = 1/4.',
    remedial_material_id: ''
  }
];

// ==========================================
// R2: TOTAL BAYAR & OPERASI RUPIAH
// ==========================================
banks['R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH.csv'] = [
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Andi membawa uang Rp 50.000. Ia jajan Rp 12.000 dan Rp 8.000. Sisa uang Andi?',
    opt_a: 'Rp 20.000', opt_b: 'Rp 30.000', opt_c: 'Rp 38.000', opt_d: 'Rp 40.000', correct: 'B',
    hint1: 'Hitung total jajan: 12.000 + 8.000.',
    hint2: 'Total jajan = 20.000.',
    hint3: 'Kurangi uang awal dengan total jajan.',
    explanation: 'Jajan = 12k + 8k = 20k. Sisa = 50.000 - 20.000 = Rp 30.000.',
    remedial_material_id: ''
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Menjumlahkan 3 barang seharga Rp 15.000, Rp 20.000, dan Rp 5.000. Totalnya adalah?',
    opt_a: 'Rp 35.000', opt_b: 'Rp 40.000', opt_c: 'Rp 45.000', opt_d: 'Rp 50.000', correct: 'B',
    hint1: 'Gunakan penjumlahan bersusun.',
    hint2: '15 + 20 + 5.',
    hint3: 'Hasilnya 40.',
    explanation: '15.000 + 20.000 + 5.000 = Rp 40.000.',
    remedial_material_id: ''
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Jika 1 lusin gelas harganya Rp 120.000, maka untuk membeli 2 lusin kamu harus membayar?',
    opt_a: 'Rp 120.000', opt_b: 'Rp 240.000', opt_c: 'Rp 360.000', opt_d: 'Rp 480.000', correct: 'B',
    hint1: 'Kalikan harga 1 lusin dengan angka 2.',
    hint2: '120.000 x 2.',
    hint3: '12 dikali 2 adalah 24, tambah nol empat.',
    explanation: 'Total = 2 x 120.000 = Rp 240.000.',
    remedial_material_id: ''
  }
];

// ==========================================
// R3: PEMBAGIAN DAN HARGA PER UNIT
// ==========================================
banks['R3_PEMBAGIAN_DAN_HARGA_PER_UNIT.csv'] = [
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Harga 5 buku tulis adalah Rp 25.000. Berapakah harga 1 buah buku tulis?',
    opt_a: 'Rp 4.000', opt_b: 'Rp 5.000', opt_c: 'Rp 6.000', opt_d: 'Rp 10.000', correct: 'B',
    hint1: 'Bagi total harga dengan jumlah barang.',
    hint2: '25.000 / 5.',
    hint3: '25 dibagi 5 = 5.',
    explanation: 'Harga 1 unit = 25.000 / 5 = Rp 5.000.',
    remedial_material_id: ''
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Uang Rp 100.000 dibagikan rata kepada 4 anak. Masing-masing mendapat?',
    opt_a: 'Rp 20.000', opt_b: 'Rp 25.000', opt_c: 'Rp 30.000', opt_d: 'Rp 40.000', correct: 'B',
    hint1: 'Lakukan pembagian: 100 dibagi 4.',
    hint2: 'Separuh dari 100 adalah 50. Separuh dari 50 adalah 25.',
    hint3: '100.000 / 4 = 25.000.',
    explanation: 'Setiap anak = 100.000 / 4 = Rp 25.000.',
    remedial_material_id: ''
  },
  {
    mode: 'PRACTICE', indicator: 'I1', difficulty: 1, question_type: 'PG',
    question: 'Jika modal jualan 10 bungkus keripik adalah Rp 50.000, maka modal untuk 1 bungkusnya adalah?',
    opt_a: 'Rp 4.000', opt_b: 'Rp 5.000', opt_c: 'Rp 10.000', opt_d: 'Rp 50.000', correct: 'B',
    hint1: 'Bagi modal total dengan jumlah bungkus.',
    hint2: '50.000 / 10.',
    hint3: 'Coret 1 angka nol dari 50.000.',
    explanation: 'Modal/unit = 50.000 / 10 = Rp 5.000.',
    remedial_material_id: ''
  }
];

Object.keys(banks).forEach(filename => {
  saveCSV(filename, banks[filename]);
});
