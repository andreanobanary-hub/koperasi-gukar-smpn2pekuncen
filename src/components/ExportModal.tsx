import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, Database, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Anggota,
  TransaksiSimpanan,
  Pinjaman,
  Angsuran,
  TransaksiKas,
  HasilPerhitunganShu,
} from '../types/koperasi';
import { exportToExcel, exportToCsv, exportToJsonFile } from '../utils/exportHelpers';
import { storage } from '../utils/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  anggotaList: Anggota[];
  simpananList: TransaksiSimpanan[];
  pinjamanList: Pinjaman[];
  angsuranList: Angsuran[];
  kasList: TransaksiKas[];
  shuList: HasilPerhitunganShu[];
  onDataRestored: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  anggotaList,
  simpananList,
  pinjamanList,
  angsuranList,
  kasList,
  shuList,
  onDataRestored,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    exportToExcel(anggotaList, simpananList, pinjamanList, angsuranList, kasList, shuList);
  };

  const handleExportCsvKas = () => {
    const rows = kasList.map((k) => ({
      Tanggal: k.tanggal,
      NoBukti: k.noBukti,
      TipeTransaksi: k.tipeTransaksi,
      AkunDebit: k.debitAkun,
      AkunKredit: k.kreditAkun,
      KasMasuk: k.kategoriKas === 'masuk' ? k.nominal : 0,
      KasKeluar: k.kategoriKas === 'keluar' ? k.nominal : 0,
      NamaAnggota: k.namaAnggota || '',
      Catatan: k.catatan,
    }));
    exportToCsv('Buku_Kas_Koperasi', rows);
  };

  const handleExportCsvAnggota = () => {
    const rows = anggotaList.map((a) => ({
      ID: a.id,
      Nama: a.nama,
      NoHP: a.noHp,
      Alamat: a.alamat,
      TanggalBergabung: a.tanggalBergabung,
      Status: a.status,
    }));
    exportToCsv('Daftar_Anggota_Koperasi', rows);
  };

  const handleExportJson = () => {
    const backup = storage.getAllDataBackup();
    exportToJsonFile(backup, `Backup_Koperasi_Digital_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const success = storage.restoreBackup(parsed);
        if (success) {
          setIsError(false);
          setImportStatus('Data berhasil dipulihkan dari cadangan JSON!');
          onDataRestored();
        } else {
          setIsError(true);
          setImportStatus('Format berkas JSON tidak sesuai struktur data Koperasi.');
        }
      } catch (err) {
        setIsError(true);
        setImportStatus('Gagal membaca berkas JSON. Berkas mungkin rusak.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Ekspor & Cadangkan Data</h3>
              <p className="text-xs text-slate-500">Unduh laporan dalam format Excel, CSV, atau cadangan JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {importStatus && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 border ${
                isError
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {isError ? (
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              )}
              <p className="flex-1 text-xs">{importStatus}</p>
            </div>
          )}

          {/* Excel Export */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Laporan Excel Lengkap (.xlsx)</h4>
                <p className="text-xs text-slate-500">
                  Mencakup Buku Kas, Anggota, Simpanan, Pinjaman, Angsuran, & SHU dalam multi-sheet.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download size={14} /> Unduh Excel
            </button>
          </div>

          {/* CSV Export Options */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ekspor Berkas CSV</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleExportCsvKas}
                className="p-3 border border-slate-200 rounded-xl text-left hover:border-slate-300 hover:bg-slate-50/80 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-xs font-medium text-slate-700">CSV Buku Kas</span>
                </div>
                <Download size={14} className="text-slate-400" />
              </button>

              <button
                onClick={handleExportCsvAnggota}
                className="p-3 border border-slate-200 rounded-xl text-left hover:border-slate-300 hover:bg-slate-50/80 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-purple-600" />
                  <span className="text-xs font-medium text-slate-700">CSV Data Anggota</span>
                </div>
                <Download size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Backup & Restore JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-slate-700" />
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Cadangkan & Pulihkan (JSON)
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">LocalStorage</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh cadangan seluruh basis data koperasi dalam berkas JSON untuk disimpan aman, atau pulihkan data di
              perangkat lain.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={handleExportJson}
                className="flex-1 py-2 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Download size={14} /> Unduh Cadangan JSON
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload size={14} /> Pulihkan dari JSON
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
