import { Anggota, TransaksiSimpanan, Pinjaman, Angsuran, TransaksiKas, ShuConfig } from '../types/koperasi';

// Clean initial state with no sample / dummy data
export const INITIAL_ANGGOTA: Anggota[] = [];
export const INITIAL_SIMPANAN: TransaksiSimpanan[] = [];
export const INITIAL_PINJAMAN: Pinjaman[] = [];
export const INITIAL_ANGSURAN: Angsuran[] = [];
export const INITIAL_KAS: TransaksiKas[] = [];

export const INITIAL_SHU_CONFIG: ShuConfig = {
  tahunBuku: 2026,
  persentaseJasaModal: 40,
  persentaseJasaUsaha: 30,
  persentaseDanaCadangan: 20,
  persentaseDanaPengurus: 5,
  persentaseDanaSosial: 5,
};
