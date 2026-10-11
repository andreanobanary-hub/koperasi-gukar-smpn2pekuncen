import * as XLSX from 'xlsx';
import {
  Anggota,
  TransaksiSimpanan,
  Pinjaman,
  Angsuran,
  TransaksiKas,
  HasilPerhitunganShu,
} from '../types/koperasi';

export function exportToExcel(
  anggotaList: Anggota[],
  simpananList: TransaksiSimpanan[],
  pinjamanList: Pinjaman[],
  angsuranList: Angsuran[],
  kasList: TransaksiKas[],
  shuList: HasilPerhitunganShu[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Kas
  const kasRows = kasList.map((k) => ({
    'Tanggal': k.tanggal,
    'No Bukti': k.noBukti,
    'Tipe Transaksi': k.tipeTransaksi,
    'Akun Debit': k.debitAkun,
    'Akun Kredit': k.kreditAkun,
    'Kas Masuk (Rp)': k.kategoriKas === 'masuk' ? k.nominal : 0,
    'Kas Keluar (Rp)': k.kategoriKas === 'keluar' ? k.nominal : 0,
    'Nama Anggota': k.namaAnggota || '-',
    'Keterangan': k.catatan,
  }));
  const wsKas = XLSX.utils.json_to_sheet(kasRows);
  XLSX.utils.book_append_sheet(wb, wsKas, 'Buku Kas Umum');

  // 2. Sheet Anggota
  const anggotaRows = anggotaList.map((a) => {
    return {
      'ID Anggota': a.id,
      'Nama': a.nama,
      'No HP': a.noHp,
      'Alamat': a.alamat,
      'Tanggal Bergabung': a.tanggalBergabung,
      'Status': a.status.toUpperCase(),
    };
  });
  const wsAnggota = XLSX.utils.json_to_sheet(anggotaRows);
  XLSX.utils.book_append_sheet(wb, wsAnggota, 'Data Anggota');

  // 3. Sheet Simpanan
  const simpananRows = simpananList.map((s) => ({
    'ID Transaksi': s.id,
    'Tanggal': s.tanggal,
    'ID Anggota': s.idAnggota,
    'Nama Anggota': s.namaAnggota,
    'Jenis Simpanan': s.jenis.toUpperCase(),
    'Tipe': s.tipe === 'setor' ? 'SETORAN' : 'PENARIKAN',
    'Nominal (Rp)': s.nominal,
    'Catatan': s.catatan,
  }));
  const wsSimpanan = XLSX.utils.json_to_sheet(simpananRows);
  XLSX.utils.book_append_sheet(wb, wsSimpanan, 'Simpanan');

  // 4. Sheet Pinjaman
  const pinjamanRows = pinjamanList.map((p) => ({
    'ID Pinjaman': p.id,
    'ID Anggota': p.idAnggota,
    'Nama Anggota': p.namaAnggota,
    'Tgl Cair': p.tanggalPengajuan,
    'Nominal Pinjaman (Rp)': p.nominalPinjaman,
    'Tenor (Bulan)': p.tenorBulan,
    'Bunga (%/Thn)': p.bungaPersenTahun,
    'Total Bunga (Rp)': p.totalBunga,
    'Total Tagihan (Rp)': p.totalHarusDibayar,
    'Sisa Pokok (Rp)': p.sisaPinjamanPokok,
    'Sisa Total (Rp)': p.sisaTotalTagihan,
    'Status': p.status.toUpperCase(),
    'Tujuan Pinjaman': p.tujuan,
  }));
  const wsPinjaman = XLSX.utils.json_to_sheet(pinjamanRows);
  XLSX.utils.book_append_sheet(wb, wsPinjaman, 'Pinjaman');

  // 5. Sheet Riwayat Angsuran
  const angsuranRows = angsuranList.map((an) => ({
    'ID Angsuran': an.id,
    'ID Pinjaman': an.idPinjaman,
    'ID Anggota': an.idAnggota,
    'Nama Anggota': an.namaAnggota,
    'Angsuran Ke': an.angsuranKe,
    'Tgl Bayar': an.tanggalBayar,
    'Pokok (Rp)': an.pokokDibayar,
    'Bunga (Rp)': an.bungaDibayar,
    'Total Bayar (Rp)': an.totalDibayar,
    'Keterangan': an.keterangan,
  }));
  const wsAngsuran = XLSX.utils.json_to_sheet(angsuranRows);
  XLSX.utils.book_append_sheet(wb, wsAngsuran, 'Riwayat Angsuran');

  // 6. Sheet Simulasi SHU
  if (shuList.length > 0) {
    const shuRows = shuList.map((sh) => ({
      'ID Anggota': sh.idAnggota,
      'Nama Anggota': sh.namaAnggota,
      'Total Simpanan (Rp)': sh.totalSimpanan,
      '% Porsi Simpanan': `${sh.persentaseSimpanan.toFixed(2)}%`,
      'SHU Jasa Modal (Rp)': sh.shuJasaModal,
      'Volume Pinjaman/Bunga (Rp)': sh.totalPinjamanDanBunga,
      '% Porsi Usaha': `${sh.persentaseUsaha.toFixed(2)}%`,
      'SHU Jasa Usaha (Rp)': sh.shuJasaUsaha,
      'TOTAL SHU DITERIMA (Rp)': sh.totalShuDiterima,
    }));
    const wsShu = XLSX.utils.json_to_sheet(shuRows);
    XLSX.utils.book_append_sheet(wb, wsShu, 'Pembagian SHU');
  }

  const filename = `Laporan_Koperasi_Digital_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((fieldName) => {
          const val = row[fieldName] !== undefined && row[fieldName] !== null ? String(row[fieldName]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(';')
    ),
  ].join('\r\n');

  // Add BOM for Indonesian / Excel Unicode support
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJsonFile(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
