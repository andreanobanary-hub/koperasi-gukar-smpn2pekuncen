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

// Version 2 keys to ensure pristine empty initial state
const KEYS = {
  ANGGOTA: 'koperasi_data_anggota_v2',
  SIMPANAN: 'koperasi_data_simpanan_v2',
  PINJAMAN: 'koperasi_data_pinjaman_v2',
  ANGSURAN: 'koperasi_data_angsuran_v2',
  KAS: 'koperasi_data_kas_v2',
  SHU_CONFIG: 'koperasi_data_shu_config_v2',
};

// Purge legacy v1 demo data if present in localStorage
try {
  ['koperasi_data_anggota_v1', 'koperasi_data_simpanan_v1', 'koperasi_data_pinjaman_v1', 'koperasi_data_angsuran_v1', 'koperasi_data_kas_v1', 'koperasi_data_shu_config_v1'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch {
  // Ignore in SSR or restricted environments
}

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
    try {
      localStorage.setItem(KEYS.ANGGOTA, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save anggota to localStorage', e);
    }
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
    try {
      localStorage.setItem(KEYS.SIMPANAN, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save simpanan to localStorage', e);
    }
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
    try {
      localStorage.setItem(KEYS.PINJAMAN, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save pinjaman to localStorage', e);
    }
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
    try {
      localStorage.setItem(KEYS.ANGSURAN, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save angsuran to localStorage', e);
    }
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
    try {
      localStorage.setItem(KEYS.KAS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save kas to localStorage', e);
    }
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
    try {
      localStorage.setItem(KEYS.SHU_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save shu config to localStorage', e);
    }
  },

  resetAllData() {
    this.saveAnggota([]);
    this.saveSimpanan([]);
    this.savePinjaman([]);
    this.saveAngsuran([]);
    this.saveKas([]);
    this.saveShuConfig(INITIAL_SHU_CONFIG);
  },

  getAllDataBackup() {
    return {
      version: '2.0',
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
