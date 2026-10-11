import {
  Anggota,
  TransaksiSimpanan,
  Pinjaman,
  Angsuran,
  TransaksiKas,
  ShuConfig,
} from '../types/koperasi';
import {
  INITIAL_ANGGOTA,
  INITIAL_SIMPANAN,
  INITIAL_PINJAMAN,
  INITIAL_ANGSURAN,
  INITIAL_KAS,
  INITIAL_SHU_CONFIG,
} from './seedData';

const KEYS = {
  ANGGOTA: 'koperasi_data_anggota_v1',
  SIMPANAN: 'koperasi_data_simpanan_v1',
  PINJAMAN: 'koperasi_data_pinjaman_v1',
  ANGSURAN: 'koperasi_data_angsuran_v1',
  KAS: 'koperasi_data_kas_v1',
  SHU_CONFIG: 'koperasi_data_shu_config_v1',
};

export const storage = {
  getAnggota(): Anggota[] {
    try {
      const data = localStorage.getItem(KEYS.ANGGOTA);
      if (!data) {
        this.saveAnggota(INITIAL_ANGGOTA);
        return INITIAL_ANGGOTA;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ANGGOTA;
    }
  },
  saveAnggota(items: Anggota[]) {
    localStorage.setItem(KEYS.ANGGOTA, JSON.stringify(items));
  },

  getSimpanan(): TransaksiSimpanan[] {
    try {
      const data = localStorage.getItem(KEYS.SIMPANAN);
      if (!data) {
        this.saveSimpanan(INITIAL_SIMPANAN);
        return INITIAL_SIMPANAN;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SIMPANAN;
    }
  },
  saveSimpanan(items: TransaksiSimpanan[]) {
    localStorage.setItem(KEYS.SIMPANAN, JSON.stringify(items));
  },

  getPinjaman(): Pinjaman[] {
    try {
      const data = localStorage.getItem(KEYS.PINJAMAN);
      if (!data) {
        this.savePinjaman(INITIAL_PINJAMAN);
        return INITIAL_PINJAMAN;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PINJAMAN;
    }
  },
  savePinjaman(items: Pinjaman[]) {
    localStorage.setItem(KEYS.PINJAMAN, JSON.stringify(items));
  },

  getAngsuran(): Angsuran[] {
    try {
      const data = localStorage.getItem(KEYS.ANGSURAN);
      if (!data) {
        this.saveAngsuran(INITIAL_ANGSURAN);
        return INITIAL_ANGSURAN;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ANGSURAN;
    }
  },
  saveAngsuran(items: Angsuran[]) {
    localStorage.setItem(KEYS.ANGSURAN, JSON.stringify(items));
  },

  getKas(): TransaksiKas[] {
    try {
      const data = localStorage.getItem(KEYS.KAS);
      if (!data) {
        this.saveKas(INITIAL_KAS);
        return INITIAL_KAS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_KAS;
    }
  },
  saveKas(items: TransaksiKas[]) {
    localStorage.setItem(KEYS.KAS, JSON.stringify(items));
  },

  getShuConfig(): ShuConfig {
    try {
      const data = localStorage.getItem(KEYS.SHU_CONFIG);
      if (!data) {
        this.saveShuConfig(INITIAL_SHU_CONFIG);
        return INITIAL_SHU_CONFIG;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SHU_CONFIG;
    }
  },
  saveShuConfig(config: ShuConfig) {
    localStorage.setItem(KEYS.SHU_CONFIG, JSON.stringify(config));
  },

  resetAllData() {
    this.saveAnggota(INITIAL_ANGGOTA);
    this.saveSimpanan(INITIAL_SIMPANAN);
    this.savePinjaman(INITIAL_PINJAMAN);
    this.saveAngsuran(INITIAL_ANGSURAN);
    this.saveKas(INITIAL_KAS);
    this.saveShuConfig(INITIAL_SHU_CONFIG);
  },

  getAllDataBackup() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      anggota: this.getAnggota(),
      simpanan: this.getSimpanan(),
      pinjaman: this.getPinjaman(),
      angsuran: this.getAngsuran(),
      kas: this.getKas(),
      shuConfig: this.getShuConfig(),
    };
  },

  restoreBackup(backupData: any): boolean {
    if (!backupData || !backupData.anggota) return false;
    if (Array.isArray(backupData.anggota)) this.saveAnggota(backupData.anggota);
    if (Array.isArray(backupData.simpanan)) this.saveSimpanan(backupData.simpanan);
    if (Array.isArray(backupData.pinjaman)) this.savePinjaman(backupData.pinjaman);
    if (Array.isArray(backupData.angsuran)) this.saveAngsuran(backupData.angsuran);
    if (Array.isArray(backupData.kas)) this.saveKas(backupData.kas);
    if (backupData.shuConfig) this.saveShuConfig(backupData.shuConfig);
    return true;
  },
};
