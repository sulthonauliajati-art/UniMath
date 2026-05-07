import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '../apps/web/src/lib/db/schema';

// Coba load .env dari apps/web/.env.local atau .env di root
const envPaths = [
  path.join(__dirname, '../apps/web/.env.local'),
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../.env'),
];

for (const ep of envPaths) {
  if (fs.existsSync(ep)) {
    config({ path: ep });
    break;
  }
}

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ ERROR: Variabel TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan.');
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

function parseCSV(text: string): string[][] {
  // Normalize line endings to avoid \r at the end of columns
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

// Judul referensi material baru
const materialTitles: Record<string, string> = {
  'M1A_DISKON_HARGA_AKHIR': 'Menghitung Diskon dan Harga Akhir',
  'M1B_PPN_BIAYA_LAYANAN_ONGKIR': 'Menghitung PPN, Biaya Layanan, dan Ongkir',
  'M1C_UNTUNG_RUGI_PERSENTASE': 'Keuntungan, Kerugian, dan Persentasenya',
  'M1D_BUNGA_SEDERHANA': 'Perhitungan Bunga Sederhana',
  'M1E_BRUTO_NETO_TARA': 'Memahami Bruto, Neto, dan Tara',
  'M1F_PROMO_TRANSAKSI_KEPUTUSAN': 'Pengambilan Keputusan Promo & Transaksi',
  'R1_OPERASI_PERSEN_DASAR': '[Remedial] Operasi Persen Dasar',
  'R2_TOTAL_BAYAR_DAN_OPERASI_RUPIAH': '[Remedial] Total Bayar & Operasi Rupiah',
  'R3_PEMBAGIAN_DAN_HARGA_PER_UNIT': '[Remedial] Pembagian & Harga Per Unit',
};

async function main() {
  console.log('🚀 Memulai proses Batch Import Practice Packs...\n');

  const csvDir = path.join(__dirname, '../bank-soal-final');
  if (!fs.existsSync(csvDir)) {
    console.error(`❌ Folder ${csvDir} tidak ditemukan!`);
    process.exit(1);
  }

  const files = fs.readdirSync(csvDir).filter((f) => f.endsWith('.csv'));
  if (files.length === 0) {
    console.error('❌ Tidak ada file CSV yang ditemukan.');
    process.exit(1);
  }

  let totalImported = 0;
  let totalErrors = 0;

  for (const file of files) {
    const materialId = file.replace('.csv', '');
    const filePath = path.join(csvDir, file);
    console.log(`\n📄 Memproses file: ${file} (Material ID: ${materialId})`);

    // 1. Pastikan material ada
    const existingMaterial = await db.query.materials.findFirst({
      where: eq(schema.materials.id, materialId)
    });

    if (!existingMaterial) {
      console.log(`   ⚡ Material ${materialId} belum ada. Membuat material baru...`);
      await db.insert(schema.materials).values({
        id: materialId,
        title: materialTitles[materialId] || materialId,
        order: 99,
        grade: '4', // Grade default
        isActive: true,
      });
    }

    // 2. Bersihkan soal lama (opsional) agar tidak duplikat jika di-run ulang
    await db.delete(schema.questions).where(eq(schema.questions.materialId, materialId));
    console.log(`   🧹 Membersihkan soal lama untuk ${materialId}...`);

    // 3. Baca dan parse CSV
    const text = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(text);

    // Skip header row
    const dataRows = rows.slice(1).filter((row) => row.length >= 7 && row[0]);

    if (dataRows.length === 0) {
      console.log(`   ⚠️ Tidak ada data pada ${file}`);
      continue;
    }

    const questionsToInsert: any[] = [];
    let fileErrors = 0;

    dataRows.forEach((row, index) => {
      const rowNum = index + 2;
      if (row.length < 10) {
        console.error(`   ❌ Baris ${rowNum}: Jumlah kolom tidak cukup (${row.length} kolom).`);
        fileErrors++;
        return;
      }

      const [
        modeRaw, indicatorRaw, difficultyRaw, questionTypeRaw, question,
        optA, optB, optC, optD, correctRaw,
        hint1, hint2, hint3, explanation, remedialMaterialIdRaw,
      ] = row;

      const mode = modeRaw?.toUpperCase() || 'ALL';
      const indicator = indicatorRaw?.toUpperCase() || 'I1';
      const difficulty = parseInt(difficultyRaw) || 1;
      const questionType = questionTypeRaw?.toUpperCase() || 'PG';
      const correct = correctRaw?.toUpperCase() || 'A';
      
      const remedialMaterialId = remedialMaterialIdRaw?.trim() || null;

      questionsToInsert.push({
        id: `Q${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6).toUpperCase()}_${materialId}_${index}`,
        materialId,
        mode,
        indicator,
        difficulty,
        questionType,
        question: question || '',
        optA: optA || '',
        optB: optB || '',
        optC: optC || '',
        optD: optD || '',
        correct: correct as 'A' | 'B' | 'C' | 'D',
        hint1: hint1 || null,
        hint2: hint2 || null,
        hint3: hint3 || null,
        explanation: explanation || null,
        remedialMaterialId: remedialMaterialId,
      });
    });

    if (questionsToInsert.length > 0) {
      // Insert in batches of 50
      const batchSize = 50;
      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize);
        await db.insert(schema.questions).values(batch);
      }
      console.log(`   ✅ Berhasil import ${questionsToInsert.length} soal untuk ${materialId}.`);
      totalImported += questionsToInsert.length;
    }

    totalErrors += fileErrors;
  }

  console.log('\n=============================================');
  console.log('✅ BATCH IMPORT SELESAI');
  console.log(`📊 Total soal berhasil di-import : ${totalImported}`);
  console.log(`📊 Total error baris             : ${totalErrors}`);
  console.log('=============================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan saat import:', err);
  process.exit(1);
});
