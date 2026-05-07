import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})
const db = drizzle(client, { schema })

const materialsContent = [
  {
    id: 'M1A_DISKON_HARGA_AKHIR',
    title: 'Diskon dan Harga Akhir',
    shortDescription: 'Materi ini membahas cara menentukan besar diskon, harga setelah diskon, dan harga awal jika diketahui harga akhir.',
    learningObjectives: JSON.stringify([
      'Murid mampu menentukan besar diskon dari harga awal.',
      'Murid mampu menentukan harga setelah diskon.',
      'Murid mampu menentukan harga awal dari harga akhir.',
      'Murid mampu menilai apakah hasil perhitungan diskon masuk akal.',
    ]),
    summaryContent: `Diskon adalah potongan harga yang diberikan penjual kepada pembeli. Besar diskon biasanya dinyatakan dalam persen dari harga awal.

Hubungan dasar:
- besar diskon = persen diskon × harga awal
- harga setelah diskon = harga awal − besar diskon

Contoh 1:
Harga sebuah tas Rp120.000 dengan diskon 20%.
Besar diskon = 20% × Rp120.000 = Rp24.000
Harga setelah diskon = Rp120.000 − Rp24.000 = Rp96.000

Contoh 2:
Harga setelah diskon 10% adalah Rp180.000.
Karena diskon 10%, maka harga yang dibayar adalah 90% dari harga awal.
Jadi:
90% × harga awal = Rp180.000
harga awal = Rp180.000 ÷ 0,9 = Rp200.000

Hal penting:
- diskon dihitung dari harga awal
- harga akhir diperoleh setelah harga awal dikurangi diskon
- jika diskon kecil, harga akhir biasanya masih dekat dengan harga awal`,
    commonMistakes: `- Murid langsung menganggap hasil persen sebagai harga akhir, padahal itu baru besar diskon.
- Murid salah membedakan antara harga awal, besar diskon, dan harga setelah diskon.
- Murid salah saat membalik dari harga akhir ke harga awal.
- Murid tidak memeriksa kewajaran hasil, misalnya harga akhir malah lebih besar dari harga awal.`,
    remedialText: `Kamu tampaknya masih kesulitan pada konsep diskon. Ingat, diskon adalah potongan dari harga awal. Jadi langkah yang benar adalah:
1. tentukan besar diskon,
2. kurangi dari harga awal,
3. periksa apakah hasilnya masuk akal.

Kalau diketahui harga akhir, pikirkan dulu berapa persen harga yang masih dibayar setelah diskon.`,
    videoDescription: `Video singkat materi ini sebaiknya menjelaskan:
- arti diskon dalam kehidupan sehari-hari,
- cara menghitung besar diskon,
- cara menghitung harga setelah diskon,
- cara menentukan harga awal dari harga akhir,
- satu contoh soal sederhana dan satu contoh soal balik.
Durasi ideal: 2–4 menit.`,
    checkpointQuestion: 'Harga sebuah buku Rp100.000 dan mendapat diskon 10%. Berapakah harga setelah diskon?',
    checkpointAnswer: 'Rp90.000',
  },
  {
    id: 'M1B_PPN_BIAYA_LAYANAN_ONGKIR',
    title: 'PPN, Biaya Layanan, dan Ongkir',
    shortDescription: 'Materi ini membahas total pembayaran ketika transaksi melibatkan potongan dan tambahan biaya seperti PPN, biaya layanan, dan ongkir.',
    learningObjectives: JSON.stringify([
      'Murid mampu menentukan total bayar setelah diskon dan PPN.',
      'Murid mampu menentukan total bayar jika ada voucher, biaya layanan, dan ongkir.',
      'Murid mampu memilih urutan operasi yang benar dalam transaksi.',
    ]),
    summaryContent: `Dalam transaksi belanja, harga yang dibayar tidak selalu hanya harga barang. Kadang ada potongan, tetapi kadang juga ada tambahan biaya seperti PPN, biaya layanan, dan ongkir.

Langkah umum:
1. tentukan harga setelah potongan atau voucher,
2. hitung biaya tambahan yang bergantung pada harga tersebut,
3. tambahkan biaya lain seperti ongkir atau admin tetap.

Contoh 1:
Harga barang Rp200.000, diskon 10%, lalu dikenakan PPN 11%.
Harga setelah diskon = Rp200.000 − 10% × Rp200.000 = Rp180.000
PPN = 11% × Rp180.000 = Rp19.800
Total bayar = Rp180.000 + Rp19.800 = Rp199.800

Contoh 2:
Harga barang Rp150.000, voucher Rp20.000, biaya layanan 2%, ongkir Rp10.000
Harga setelah voucher = Rp150.000 − Rp20.000 = Rp130.000
Biaya layanan = 2% × Rp130.000 = Rp2.600
Total bayar = Rp130.000 + Rp2.600 + Rp10.000 = Rp142.600

Hal penting:
- potongan mengurangi harga
- biaya layanan dan PPN menambah total bayar
- urutan operasi harus benar`,
    commonMistakes: `- PPN dihitung dari harga awal, padahal seharusnya dari harga setelah potongan jika konteksnya begitu.
- Ongkir atau biaya admin terlupa ditambahkan.
- Voucher dan biaya layanan diperlakukan sama, padahal voucher mengurangi harga dan biaya layanan menambah total.
- Murid tidak menuliskan langkah secara berurutan.`,
    remedialText: `Kamu perlu mengingat urutan menghitung total transaksi:
- kurangi harga dengan potongan atau voucher terlebih dahulu,
- setelah itu hitung tambahan seperti PPN atau biaya layanan,
- lalu tambahkan ongkir atau biaya tetap lainnya.

Coba fokus pada pertanyaan: mana yang mengurangi harga, dan mana yang menambah total?`,
    videoDescription: `Video singkat materi ini sebaiknya menampilkan:
- simulasi transaksi belanja online,
- urutan diskon/voucher lalu biaya tambahan,
- contoh soal dengan PPN,
- contoh soal dengan biaya layanan dan ongkir,
- tips menghindari salah urutan.
Durasi ideal: 3–4 menit.`,
    checkpointQuestion: 'Harga barang Rp100.000, voucher Rp10.000, ongkir Rp5.000. Berapa total yang harus dibayar jika tidak ada biaya lain?',
    checkpointAnswer: 'Rp95.000',
  },
  {
    id: 'M1C_UNTUNG_RUGI_PERSENTASE',
    title: 'Untung, Rugi, dan Persentase',
    shortDescription: 'Materi ini membahas cara menentukan untung, rugi, persentase untung/rugi, dan harga jual untuk target keuntungan tertentu.',
    learningObjectives: JSON.stringify([
      'Murid mampu menentukan besar untung atau rugi.',
      'Murid mampu menghitung persentase untung/rugi.',
      'Murid mampu menentukan harga jual untuk memperoleh keuntungan tertentu.',
      'Murid mampu menilai hasil transaksi secara tepat.',
    ]),
    summaryContent: `Untung terjadi jika harga jual lebih besar daripada modal. Rugi terjadi jika harga jual lebih kecil daripada modal.

Hubungan dasar:
- untung = harga jual − modal
- rugi = modal − harga jual
- persentase untung = untung ÷ modal × 100%
- persentase rugi = rugi ÷ modal × 100%

Contoh 1:
Modal sebuah barang Rp80.000, dijual Rp100.000
Untung = Rp100.000 − Rp80.000 = Rp20.000
Persentase untung = Rp20.000 ÷ Rp80.000 × 100% = 25%

Contoh 2:
Modal Rp90.000, dijual Rp72.000
Rugi = Rp90.000 − Rp72.000 = Rp18.000
Persentase rugi = Rp18.000 ÷ Rp90.000 × 100% = 20%

Jika ingin menentukan harga jual dari target keuntungan:
harga jual = modal + keuntungan
Jika keuntungan ditentukan dalam persen:
keuntungan = persen × modal`,
    commonMistakes: `- Murid membagi untung dengan harga jual, bukan dengan modal.
- Murid keliru membedakan untung dan rugi.
- Murid lupa menambahkan target keuntungan ke modal saat mencari harga jual.
- Murid tidak memeriksa apakah hasil akhir sesuai konteks transaksi.`,
    remedialText: `Fokus utama pada materi ini adalah membedakan:
- modal,
- harga jual,
- untung,
- rugi.

Setelah itu, jika diminta persentase, selalu bandingkan untung atau rugi dengan modal.
Jika diminta harga jual target, hitung dulu keuntungan yang diinginkan, lalu tambahkan ke modal.`,
    videoDescription: `Video singkat materi ini sebaiknya memuat:
- perbedaan untung dan rugi,
- rumus dasar,
- contoh persentase keuntungan,
- contoh persentase kerugian,
- contoh menentukan harga jual dari target laba.
Durasi ideal: 3–4 menit.`,
    checkpointQuestion: 'Sebuah barang bermodal Rp50.000 dijual Rp60.000. Berapakah keuntungan yang diperoleh?',
    checkpointAnswer: 'Rp10.000',
  },
  {
    id: 'M1D_BUNGA_SEDERHANA',
    title: 'Bunga Sederhana',
    shortDescription: 'Materi ini membahas bunga sederhana pada tabungan atau pinjaman serta jumlah akhir yang diperoleh atau harus dikembalikan.',
    learningObjectives: JSON.stringify([
      'Murid mampu menghitung bunga sederhana.',
      'Murid mampu menentukan jumlah akhir tabungan.',
      'Murid mampu menentukan total pengembalian pinjaman.',
      'Murid mampu menilai hasil perhitungan bunga.',
    ]),
    summaryContent: `Bunga sederhana adalah bunga yang dihitung dari modal awal.

Hubungan dasar:
- bunga = modal × persen bunga × waktu
- jumlah akhir = modal + bunga

Perhatikan satuan waktu:
- jika bunga per bulan, waktu harus dalam bulan
- jika bunga per tahun, waktu harus dalam tahun atau diubah menjadi bagian tahun

Contoh 1:
Tabungan Rp500.000, bunga sederhana 2% per bulan, selama 3 bulan
Bunga = 500.000 × 2% × 3 = 30.000
Jumlah akhir = 500.000 + 30.000 = 530.000

Contoh 2:
Tabungan Rp2.400.000, bunga sederhana 6% per tahun, selama 8 bulan
Waktu = 8/12 tahun
Bunga = 2.400.000 × 6% × 8/12 = 96.000
Jumlah akhir = 2.400.000 + 96.000 = 2.496.000

Hal penting:
- bunga sederhana selalu dihitung dari modal awal
- pastikan satuan waktu sesuai`,
    commonMistakes: `- Murid salah mencocokkan satuan waktu dengan persen bunga.
- Murid menghitung bunga dari jumlah akhir, bukan dari modal awal.
- Murid lupa menambahkan bunga ke modal saat mencari jumlah akhir.
- Murid tidak memeriksa apakah hasil bunga terlalu besar atau terlalu kecil.`,
    remedialText: `Perhatikan dua hal utama pada bunga sederhana:
1. bunga selalu dihitung dari modal awal,
2. satuan waktu harus cocok dengan jenis bunga.

Kalau bunga dinyatakan per bulan, gunakan bulan. Kalau per tahun, gunakan tahun atau ubah bulan menjadi bagian dari tahun.`,
    videoDescription: `Video singkat materi ini sebaiknya menjelaskan:
- arti bunga sederhana,
- rumus bunga,
- perbedaan modal, bunga, dan jumlah akhir,
- contoh bunga per bulan,
- contoh bunga per tahun dengan waktu dalam bulan.
Durasi ideal: 2–4 menit.`,
    checkpointQuestion: 'Seseorang menabung Rp1.000.000 dengan bunga sederhana 1% per bulan selama 2 bulan. Berapakah besar bunganya?',
    checkpointAnswer: 'Rp20.000',
  },
  {
    id: 'M1E_BRUTO_NETO_TARA',
    title: 'Bruto, Neto, dan Tara',
    shortDescription: 'Materi ini membahas hubungan antara berat kotor, berat bersih, dan berat kemasan.',
    learningObjectives: JSON.stringify([
      'Murid mampu membedakan bruto, neto, dan tara.',
      'Murid mampu menentukan salah satu besaran jika dua lainnya diketahui.',
      'Murid mampu menggunakan hubungan bruto-neto-tara dalam konteks kemasan.',
    ]),
    summaryContent: `Dalam kemasan barang, ada tiga istilah penting:
- bruto = berat total, termasuk isi dan kemasan
- neto = berat isi bersih
- tara = berat kemasan

Hubungan dasar:
- bruto = neto + tara
- neto = bruto − tara
- tara = bruto − neto

Contoh 1:
Bruto 5 kg, tara 0,2 kg
Neto = 5 − 0,2 = 4,8 kg

Contoh 2:
Bruto 8 kg, tara 5% dari bruto
Tara = 5% × 8 = 0,4 kg
Neto = 8 − 0,4 = 7,6 kg

Hal penting:
- neto tidak mungkin lebih besar dari bruto
- jika tara dinyatakan dalam persen, hitung dulu besar tara
- perhatikan satuan gram dan kilogram`,
    commonMistakes: `- Murid tertukar antara bruto dan neto.
- Murid menambahkan tara ke bruto saat mencari neto.
- Murid salah mengubah gram ke kilogram atau sebaliknya.
- Murid tidak memeriksa apakah hasil akhir masuk akal.`,
    remedialText: `Ingat kembali arti tiga istilah utama:
- bruto = total
- neto = isi bersih
- tara = kemasan

Kalau mencari neto, berarti berat kemasan harus dikurangi dari berat total.
Kalau mencari tara, bandingkan bruto dengan neto.`,
    videoDescription: `Video singkat materi ini sebaiknya memuat:
- penjelasan istilah bruto, neto, tara,
- ilustrasi kemasan barang,
- contoh hitung neto dari bruto dan tara,
- contoh tara dalam persen,
- contoh konversi gram ke kilogram.
Durasi ideal: 2–3 menit.`,
    checkpointQuestion: 'Sebuah paket memiliki bruto 3 kg dan tara 0,2 kg. Berapakah neto paket tersebut?',
    checkpointAnswer: '2,8 kg',
  },
  {
    id: 'M1F_PROMO_TRANSAKSI_KEPUTUSAN',
    title: 'Promo, Transaksi, dan Keputusan Hemat',
    shortDescription: 'Materi ini membahas cara membaca transaksi, membandingkan promo, memperkirakan total bayar, dan menentukan pilihan paling hemat.',
    learningObjectives: JSON.stringify([
      'Murid mampu membaca tabel transaksi sederhana.',
      'Murid mampu menghitung total pembayaran dari beberapa item.',
      'Murid mampu membandingkan dua promo atau dua opsi pembayaran.',
      'Murid mampu menentukan keputusan yang lebih hemat dan masuk akal.',
    ]),
    summaryContent: `Dalam kehidupan sehari-hari, kita sering harus memilih promo atau menghitung total belanja dari beberapa barang sekaligus. Karena itu, penting untuk membaca data transaksi dengan teliti.

Langkah umum:
1. hitung subtotal tiap barang,
2. perhatikan apakah ada diskon, potongan, atau biaya tambahan,
3. hitung total akhir setiap opsi,
4. bandingkan hasil akhirnya,
5. pilih opsi dengan total paling kecil jika pertanyaannya tentang pilihan paling hemat.

Contoh 1:
Promo A: diskon 20% dari harga Rp100.000
Harga akhir = Rp80.000

Promo B: potongan langsung Rp15.000
Harga akhir = Rp85.000

Jadi, Promo A lebih hemat.

Contoh 2:
2 buku @ Rp10.000 dan 3 pensil @ Rp5.000
Total = 2 × 10.000 + 3 × 5.000 = 35.000

Hal penting:
- jangan hanya melihat persen diskon, hitung total akhirnya
- jika ada biaya tambahan, jangan lupa ditambahkan
- cek apakah hasil akhir masih masuk akal`,
    commonMistakes: `- Murid hanya melihat diskon terbesar tanpa menghitung total akhir.
- Murid lupa menambahkan biaya admin, ongkir, atau layanan.
- Murid salah menjumlahkan subtotal transaksi.
- Murid tidak membandingkan dua opsi secara lengkap.`,
    remedialText: `Saat membandingkan promo, fokuslah pada total akhir yang harus dibayar, bukan hanya pada besar diskon atau potongan.
Hitung tiap opsi secara lengkap, lalu bandingkan hasil akhirnya.
Jika ada beberapa barang, hitung subtotal masing-masing dulu sebelum menjumlahkan semuanya.`,
    videoDescription: `Video singkat materi ini sebaiknya memuat:
- contoh membaca tabel transaksi,
- contoh membandingkan dua promo,
- contoh memilih opsi paling hemat,
- contoh mengecek kewajaran total belanja.
Durasi ideal: 3–4 menit.`,
    checkpointQuestion: 'Harga barang Rp100.000. Promo A diskon 10%. Promo B potongan langsung Rp8.000. Promo mana yang lebih hemat?',
    checkpointAnswer: 'Promo A, karena harga akhir Rp90.000 sedangkan Promo B Rp92.000.',
  },
  {
    id: 'R1_OPERASI_PERSEN_DASAR',
    title: 'Operasi Persen Dasar',
    shortDescription: 'Materi remedial ini membantu murid memahami persen sebagai dasar untuk diskon, untung-rugi, PPN, dan bunga.',
    learningObjectives: JSON.stringify([
      'Murid mampu mengubah persen ke desimal.',
      'Murid mampu menghitung persen dari suatu bilangan.',
      'Murid mampu menggunakan persen dalam perhitungan sederhana.',
    ]),
    summaryContent: `Persen berarti per seratus.

Contoh:
- 10% = 10/100 = 0,1
- 20% = 20/100 = 0,2
- 25% = 25/100 = 0,25
- 50% = 50/100 = 0,5

Cara menghitung persen dari suatu bilangan:
persen × bilangan

Contoh:
20% dari 150.000 = 0,2 × 150.000 = 30.000
15% dari 200.000 = 0,15 × 200.000 = 30.000

Hal penting:
- ubah persen ke bentuk desimal sebelum dikalikan
- pahami bahwa 10% berarti sepersepuluh dari jumlah awal`,
    commonMistakes: `- Murid tidak mengubah persen ke desimal sebelum mengalikan.
- Murid salah menempatkan koma desimal.
- Murid bingung membedakan persen dan desimal.`,
    remedialText: 'Kamu perlu menguatkan operasi persen dasar. Ubah persen ke desimal terlebih dahulu, lalu kalikan dengan nilai yang diketahui.',
    videoDescription: `Video sebaiknya berisi:
- arti persen,
- cara ubah persen ke desimal,
- contoh 10%, 20%, 25%, 50%,
- contoh menghitung persen dari harga.
Durasi ideal: 1–2 menit.`,
    checkpointQuestion: 'Berapakah 20% dari Rp100.000?',
    checkpointAnswer: 'Rp20.000',
  },
  {
    id: 'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH',
    title: 'Total Bayar dan Operasi Rupiah',
    shortDescription: 'Materi remedial ini membantu murid menghitung total transaksi dengan benar ketika ada potongan dan tambahan biaya.',
    learningObjectives: JSON.stringify([
      'Murid mampu menjumlahkan komponen biaya.',
      'Murid mampu mengurangi potongan dari harga.',
      'Murid mampu menentukan total akhir transaksi.',
    ]),
    summaryContent: `Dalam transaksi, ada komponen yang mengurangi harga dan ada komponen yang menambah total bayar.

Yang mengurangi:
- diskon
- voucher
- potongan langsung

Yang menambah:
- PPN
- biaya layanan
- admin
- ongkir

Langkah umum:
1. tentukan harga setelah potongan,
2. tambahkan biaya tambahan,
3. cek total akhir.

Contoh:
Harga barang Rp150.000, voucher Rp20.000, biaya admin Rp5.000
Harga setelah voucher = 150.000 - 20.000 = 130.000
Total bayar = 130.000 + 5.000 = 135.000`,
    commonMistakes: `- Murid mencampur urutan operasi (menambah sebelum mengurangi).
- Murid lupa menambahkan biaya admin atau ongkir.
- Murid salah menghitung selisih harga setelah voucher.`,
    remedialText: 'Perhatikan dulu mana yang mengurangi harga dan mana yang menambah total. Jangan mencampur urutan operasi.',
    videoDescription: `Video sebaiknya berisi:
- komponen potongan vs tambahan biaya,
- contoh total bayar sederhana,
- contoh voucher + biaya admin,
- tips membaca transaksi.
Durasi ideal: 1–2 menit.`,
    checkpointQuestion: 'Harga barang Rp90.000, voucher Rp10.000, ongkir Rp5.000. Berapa total bayar?',
    checkpointAnswer: 'Rp85.000',
  },
  {
    id: 'R3_PEMBAGIAN_DAN_HARGA_PER_UNIT',
    title: 'Pembagian dan Harga per Unit',
    shortDescription: 'Materi remedial ini membantu murid menentukan harga satuan atau target harga per item dari total biaya atau target penjualan.',
    learningObjectives: JSON.stringify([
      'Murid mampu membagi total biaya ke jumlah item.',
      'Murid mampu menentukan harga per unit.',
      'Murid mampu menentukan harga satuan dari target omzet.',
    ]),
    summaryContent: `Jika diketahui total biaya atau total penjualan, harga per unit dapat ditentukan dengan membagi jumlah total dengan banyaknya barang.

Hubungan dasar:
harga per unit = total ÷ jumlah unit

Contoh 1:
Harga total 24 botol = Rp120.000
Harga per botol = 120.000 ÷ 24 = 5.000

Contoh 2:
Target omzet Rp150.000 dari 30 gelas
Harga per gelas = 150.000 ÷ 30 = 5.000

Hal penting:
- tentukan dulu total yang dibagi
- pastikan pembagi adalah jumlah unit
- cek apakah hasil per unit masuk akal`,
    commonMistakes: `- Murid salah menentukan mana yang dibagi dan mana yang membagi.
- Murid lupa memeriksa kewajaran hasil pembagian.
- Murid keliru menghitung total biaya sebelum membagi.`,
    remedialText: `Kalau diminta harga per unit, fokus pada dua hal:
- total uang atau total biaya,
- jumlah barang atau jumlah unit.

Setelah itu, lakukan pembagian total dengan jumlah unit.`,
    videoDescription: `Video sebaiknya berisi:
- arti harga per unit,
- contoh pembagian total ke jumlah barang,
- contoh target harga per gelas/barang,
- cara cek kewajaran hasil.
Durasi ideal: 1–2 menit.`,
    checkpointQuestion: 'Total harga 20 botol minuman adalah Rp100.000. Berapa harga per botol?',
    checkpointAnswer: 'Rp5.000',
  },
]

async function main() {
  console.log('🚀 Seeding konten akademik ke 9 material...\n')

  for (const mat of materialsContent) {
    const { id, ...data } = mat
    await db.update(schema.materials).set(data).where(eq(schema.materials.id, id))
    console.log(`✅ ${id} → "${data.title}"`)
  }

  console.log('\n═══════════════════════════════════')
  console.log('✅ SEED KONTEN AKADEMIK SELESAI')
  console.log(`📊 Total material di-update: ${materialsContent.length}`)
  console.log('═══════════════════════════════════\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
