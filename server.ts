import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Route for parsing transaction text or receipt image
  app.post('/api/parse-transaction', async (req, res) => {
    try {
      const { text, imageBase64, mimeType } = req.body;
      if (!text && !imageBase64) {
        return res.status(400).json({ error: 'Teks deskripsi atau gambar struk diperlukan.' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
      }

      const systemInstruction = `Kamu adalah mesin asisten pembukuan dan analisis keuangan koperasi digital Indonesia.
Tugasmu:
1. Membaca deskripsi transaksi atau kuitansi/struk transfer simpanan/pinjaman/angsuran/operasional koperasi.
2. Mengekstrak data penting ke dalam format JSON terstruktur.
3. Menentukan akun debit dan kredit sesuai standar akuntansi koperasi Indonesia (PSAK 27).

Aturan Jurnal Koperasi Indonesia:
- Anggota setor Simpanan Pokok/Wajib/Sukarela: Debit = "Kas/Bank", Kredit = "Simpanan Pokok" / "Simpanan Wajib" / "Simpanan Sukarela".
- Penarikan Simpanan Sukarela: Debit = "Simpanan Sukarela", Kredit = "Kas/Bank".
- Pencairan Pinjaman ke Anggota: Debit = "Piutang Pinjaman Anggota", Kredit = "Kas/Bank".
- Pembayaran Angsuran: Debit = "Kas/Bank", Kredit = "Piutang Pinjaman Anggota" (pokok) dan/atau "Pendapatan Jasa/Bunga Pinjaman".
- Beban Operasional: Debit = "Beban Operasional", Kredit = "Kas/Bank".
- Pendapatan Lain-lain: Debit = "Kas/Bank", Kredit = "Pendapatan Operasional Lain".

Format output WAJIB JSON murni tanpa markdown pembungkus.`;

      let contents: any;
      if (imageBase64) {
        contents = {
          parts: [
            {
              inlineData: {
                data: imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, ''),
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: text || 'Ekstrak detail transaksi dari struk / bukti transfer koperasi ini.',
            },
          ],
        };
      } else {
        contents = text;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tanggal: {
                type: Type.STRING,
                description: 'Format YYYY-MM-DD. Bila tidak tertulis, gunakan tanggal saat ini (2026-10-11).'
              },
              tipe_transaksi: {
                type: Type.STRING,
                description: 'Salah satu: simpanan_pokok, simpanan_wajib, simpanan_sukarela, pinjaman, angsuran, operasional_pendapatan, operasional_beban'
              },
              nominal: {
                type: Type.NUMBER,
                description: 'Total nominal transaksi (angka positif)'
              },
              id_anggota: {
                type: Type.STRING,
                description: 'ID anggota jika ada (misal KOP-001) atau null'
              },
              nama_anggota: {
                type: Type.STRING,
                description: 'Nama anggota yang bertransaksi atau null'
              },
              jurnal: {
                type: Type.OBJECT,
                properties: {
                  debit: {
                    type: Type.STRING,
                    description: 'Nama akun debit (misal: Kas/Bank, Piutang Pinjaman, dll)'
                  },
                  kredit: {
                    type: Type.STRING,
                    description: 'Nama akun kredit (misal: Simpanan Wajib, Kas/Bank, dll)'
                  }
                },
                required: ['debit', 'kredit']
              },
              catatan: {
                type: Type.STRING,
                description: 'Keterangan ringkas deskripsi transaksi'
              },
              angsuran_pokok: {
                type: Type.NUMBER,
                description: 'Khusus tipe angsuran: porsi pokok pinjaman (bila teridentifikasi)'
              },
              angsuran_bunga: {
                type: Type.NUMBER,
                description: 'Khusus tipe angsuran: porsi jasa/bunga pinjaman (bila teridentifikasi)'
              }
            },
            required: ['tanggal', 'tipe_transaksi', 'nominal', 'jurnal', 'catatan']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({ error: 'AI tidak mengembalikan hasil teks yang valid.' });
      }

      const parsed = JSON.parse(responseText.trim());
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error parsing transaction:', err);
      return res.status(500).json({
        error: err.message || 'Gagal memproses transaksi dengan AI.',
      });
    }
  });

  // API Route for Financial Health Consultation / Advice
  app.post('/api/analyze-finances', async (req, res) => {
    try {
      const { summaryData } = req.body;
      if (!summaryData) {
        return res.status(400).json({ error: 'Data ringkasan keuangan diperlukan.' });
      }

      const prompt = `Berikut adalah data posisi keuangan koperasi saat ini:
- Total Kas: Rp ${summaryData.totalKas?.toLocaleString('id-ID')}
- Total Simpanan: Rp ${summaryData.totalSimpanan?.toLocaleString('id-ID')} (Pokok: Rp ${summaryData.totalSimpananPokok?.toLocaleString('id-ID')}, Wajib: Rp ${summaryData.totalSimpananWajib?.toLocaleString('id-ID')}, Sukarela: Rp ${summaryData.totalSimpananSukarela?.toLocaleString('id-ID')})
- Total Pinjaman Beredar: Rp ${summaryData.totalPinjamanBeredar?.toLocaleString('id-ID')}
- Total Angsuran Diterima: Rp ${summaryData.totalAngsuranDiterima?.toLocaleString('id-ID')}
- Estimasi SHU Kotor: Rp ${summaryData.sisaShu?.toLocaleString('id-ID')}
- Jumlah Anggota: ${summaryData.jumlahAnggota}

Tolong berikan analisis kesehatan keuangan singkat dan 3 rekomendasi taktis bagi pengurus koperasi (dalam bahasa Indonesia, profesional, ringkas, dan memotivasi). Formatkan dalam bentuk bullet point yang jelas.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Kamu adalah konsultan keuangan spesialis Koperasi Simpan Pinjam Indonesia.',
        }
      });

      return res.json({ analysis: response.text });
    } catch (err: any) {
      console.error('Error analyzing finances:', err);
      return res.status(500).json({ error: err.message || 'Gagal membuat analisis keuangan.' });
    }
  });

  // Vite middleware in dev or static server in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Koperasi Digital Server running on http://localhost:${PORT}`);
  });
}

startServer();
