import React, { useState } from 'react';
import { Wallet, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { TransaksiKas } from '../types/koperasi';
import { formatRupiah, getTodayDateString, generateNextId } from '../utils/formatters';

interface SetSaldoKasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSaldo: number;
  existingKasList: TransaksiKas[];
  onSetKasAwal: (tx: TransaksiKas) => void;
}

export const SetSaldoKasModal: React.FC<SetSaldoKasModalProps> = ({
  isOpen,
  onClose,
  currentSaldo,
  existingKasList,
  onSetKasAwal,
}) => {
  const [nominal, setNominal] = useState<number>(10000000);
  const [tanggal, setTanggal] = useState<string>(getTodayDateString());
  const [catatan, setCatatan] = useState<string>('Modal Kas Awal Koperasi Tahun Buku 2026');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) return;

    const nextId = generateNextId(
      'KAS',
      existingKasList.map((k) => k.id)
    );

    const newTx: TransaksiKas = {
      id: nextId,
      tanggal,
      noBukti: `BKM-${nextId.split('-')[1]}`,
      tipeTransaksi: 'operasional_pendapatan',
      idAnggota: null,
      namaAnggota: null,
      debitAkun: 'Kas/Bank',
      kreditAkun: 'Modal Awal Koperasi',
      nominal,
      kategoriKas: 'masuk',
      catatan: catatan.trim() || 'Modal Kas Awal Koperasi',
    };

    onSetKasAwal(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Set Saldo Kas Awal</h3>
              <p className="text-xs text-slate-500">Inisialisasi modal awal kas koperasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Saldo Kas Saat Ini:</span>
            <span className="font-bold text-slate-800 text-sm">{formatRupiah(currentSaldo)}</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nominal Kas Awal / Modal Awal (Rp) *
            </label>
            <input
              type="number"
              min={1000}
              step={100000}
              required
              value={nominal}
              onChange={(e) => setNominal(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[5000000, 10000000, 25000000, 50000000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setNominal(amt)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 transition-colors"
                >
                  {amt / 1000000} Juta
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keterangan Jurnal</label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Standar Akuntansi Koperasi:
            </div>
            <p className="leading-relaxed opacity-90">
              Transaksi ini dicatat sebagai penerimaan kas masuk: <b>(D) Kas/Bank</b> dan <b>(K) Modal Awal Koperasi</b>.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
            >
              Simpan Kas Awal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
