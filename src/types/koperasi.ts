export interface Anggota {
  id: string; // Misal: KOP-001
  nama: string;
  noHp: string;
  alamat: string;
  tanggalBergabung: string; // YYYY-MM-DD
  status: 'aktif' | 'nonaktif';
}

export type JenisSimpanan = 'pokok' | 'wajib' | 'sukarela';
export type TipeSimpanan = 'setor' | 'tarik';

export interface TransaksiSimpanan {
  id: string;
  idAnggota: string;
  namaAnggota: string;
  tanggal: string; // YYYY-MM-DD
  jenis: JenisSimpanan;
  tipe: TipeSimpanan;
  nominal: number;
  catatan: string;
}

export interface Pinjaman {
  id: string; // Misal: PINJ-001
  idAnggota: string;
  namaAnggota: string;
  tanggalPengajuan: string; // YYYY-MM-DD
  nominalPinjaman: number;
  tenorBulan: number;
  bungaPersenTahun: number; // Misal 12 (% per tahun) = 1% per bulan
  totalBunga: number;
  totalHarusDibayar: number;
  angsuranPokokPerBulan: number;
  angsuranBungaPerBulan: number;
  totalAngsuranPerBulan: number;
  sisaPinjamanPokok: number;
  sisaTotalTagihan: number;
  status: 'aktif' | 'lunas';
  tujuan: string;
}

export interface Angsuran {
  id: string;
  idPinjaman: string;
  idAnggota: string;
  namaAnggota: string;
  angsuranKe: number;
  tanggalBayar: string; // YYYY-MM-DD
  pokokDibayar: number;
  bungaDibayar: number;
  totalDibayar: number;
  keterangan: string;
}

export type TipeTransaksiKas =
  | 'simpanan_pokok'
  | 'simpanan_wajib'
  | 'simpanan_sukarela'
  | 'tarik_sukarela'
  | 'pencairan_pinjaman'
  | 'angsuran'
  | 'operasional_pendapatan'
  | 'operasional_beban'
  | 'lainnya';

export interface TransaksiKas {
  id: string;
  tanggal: string; // YYYY-MM-DD
  noBukti: string;
  tipeTransaksi: TipeTransaksiKas;
  idAnggota: string | null;
  namaAnggota: string | null;
  debitAkun: string;
  kreditAkun: string;
  nominal: number;
  kategoriKas: 'masuk' | 'keluar' | 'non_kas';
  catatan: string;
}

export interface ShuConfig {
  tahunBuku: number;
  pendapatanOperasionalManual?: number;
  bebanOperasionalManual?: number;
  persentaseJasaModal: number; // default: 40%
  persentaseJasaUsaha: number; // default: 30%
  persentaseDanaCadangan: number; // default: 20%
  persentaseDanaPengurus: number; // default: 5%
  persentaseDanaSosial: number; // default: 5%
}

export interface HasilPerhitunganShu {
  idAnggota: string;
  namaAnggota: string;
  totalSimpanan: number;
  persentaseSimpanan: number;
  shuJasaModal: number;
  totalPinjamanDanBunga: number;
  persentaseUsaha: number;
  shuJasaUsaha: number;
  totalShuDiterima: number;
}
