import React, { useState } from 'react';
import {
  Wallet,
  PiggyBank,
  HandCoins,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Users,
  ShieldCheck,
  PlusCircle,
  FileText,
  Info,
} from 'lucide-react';
import {
  Anggota,
  TransaksiSimpanan,
  Pinjaman,
  Angsuran,
  TransaksiKas,
} from '../types/koperasi';
import { formatRupiah, formatTanggal } from '../utils/formatters';

interface DashboardTabProps {
  anggotaList: Anggota[];
  simpananList: TransaksiSimpanan[];
  pinjamanList: Pinjaman[];
  angsuranList: Angsuran[];
  kasList: TransaksiKas[];
  onNavigateTab: (tab: any) => void;
  onOpenSetKasModal: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  anggotaList,
  simpananList,
  pinjamanList,
  angsuranList,
  kasList,
  onNavigateTab,
  onOpenSetKasModal,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 1. Total Kas
  const totalKasMasuk = kasList
    .filter((k) => k.kategoriKas === 'masuk')
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalKasKeluar = kasList
    .filter((k) => k.kategoriKas === 'keluar')
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalKas = totalKasMasuk - totalKasKeluar;

  // 2. Total Simpanan
  const totalSimpananPokok = simpananList
    .filter((s) => s.jenis === 'pokok' && s.tipe === 'setor')
    .reduce((sum, s) => sum + s.nominal, 0);
  const totalSimpananWajib = simpananList
    .filter((s) => s.jenis === 'wajib' && s.tipe === 'setor')
    .reduce((sum, s) => sum + s.nominal, 0);
  const setoranSukarela = simpananList
    .filter((s) => s.jenis === 'sukarela' && s.tipe === 'setor')
    .reduce((sum, s) => sum + s.nominal, 0);
  const tarikanSukarela = simpananList
    .filter((s) => s.jenis === 'sukarela' && s.tipe === 'tarik')
    .reduce((sum, s) => sum + s.nominal, 0);
  const totalSimpananSukarela = Math.max(0, setoranSukarela - tarikanSukarela);
  const totalSimpanan = totalSimpananPokok + totalSimpananWajib + totalSimpananSukarela;

  // 3. Total Pinjaman yang sedang berjalan
  const totalPinjamanBeredar = pinjamanList
    .filter((p) => p.status === 'aktif')
    .reduce((sum, p) => sum + p.sisaPinjamanPokok, 0);
  const totalPokokTerbayar = angsuranList.reduce((sum, a) => sum + a.pokokDibayar, 0);

  // 4. Sisa SHU Tahun Berjalan
  const pendapatanBunga = angsuranList.reduce((sum, a) => sum + a.bungaDibayar, 0);
  const pendapatanOperasional = kasList
    .filter((k) => k.tipeTransaksi === 'operasional_pendapatan' && k.kreditAkun !== 'Modal Awal Koperasi')
    .reduce((sum, k) => sum + k.nominal, 0);
  const bebanOperasional = kasList
    .filter((k) => k.tipeTransaksi === 'operasional_beban')
    .reduce((sum, k) => sum + k.nominal, 0);

  const totalPendapatanKoperasi = pendapatanBunga + pendapatanOperasional;
  const sisaShu = Math.max(0, totalPendapatanKoperasi - bebanOperasional);

  // AI Financial Analysis
  const handleRequestAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const summaryData = {
        totalKas,
        totalSimpanan,
        totalSimpananPokok,
        totalSimpananWajib,
        totalSimpananSukarela,
        totalPinjamanBeredar,
        totalAngsuranDiterima: angsuranList.reduce((sum, a) => sum + a.totalDibayar, 0),
        sisaShu,
        jumlahAnggota: anggotaList.length,
      };

      const res = await fetch('/api/analyze-finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memanggil AI analisis');
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      setAnalysisError(err.message || 'Gagal terhubung dengan asisten AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recentTransactions = [...kasList].reverse().slice(0, 5);
  const isDataEmpty = anggotaList.length === 0 && kasList.length === 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner when Empty */}
      {isDataEmpty && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Info size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Aplikasi Koperasi Digital Siap Digunakan (Basis Data Bersih)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Belum ada data transaksi atau anggota. Silakan mulai dengan mengatur modal kas awal atau mendaftarkan anggota.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenSetKasModal}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <PlusCircle size={14} /> Set Kas Awal
            </button>
            <button
              onClick={() => onNavigateTab('anggota')}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Users size={14} /> + Anggota
            </button>
          </div>
        </div>
      )}

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kas Koperasi</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(totalKas)}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium inline-flex items-center">
                <ArrowUpRight size={14} /> Kas Masuk: {formatRupiah(totalKasMasuk)}
              </span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Kas Keluar: {formatRupiah(totalKasKeluar)}</span>
            <button
              onClick={onOpenSetKasModal}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              Set Kas <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Total Simpanan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Simpanan</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(totalSimpanan)}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dari <span className="font-semibold text-slate-700">{anggotaList.length}</span> anggota terdaftar
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Wajib: {formatRupiah(totalSimpananWajib)}</span>
            <button
              onClick={() => onNavigateTab('simpanan')}
              className="text-blue-700 font-medium hover:underline flex items-center"
            >
              Kelola <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Total Pinjaman Berjalan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pinjaman Berjalan</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HandCoins size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(totalPinjamanBeredar)}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {pinjamanList.filter((p) => p.status === 'aktif').length} pinjaman anggota aktif
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Terbayar: {formatRupiah(totalPokokTerbayar)}</span>
            <button
              onClick={() => onNavigateTab('pinjaman')}
              className="text-amber-700 font-medium hover:underline flex items-center"
            >
              Rincian <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Sisa SHU Berjalan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimasi Sisa SHU</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(sisaShu)}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pendapatan Bunga: <span className="text-purple-700 font-semibold">{formatRupiah(pendapatanBunga)}</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Beban: {formatRupiah(bebanOperasional)}</span>
            <button
              onClick={() => onNavigateTab('shu')}
              className="text-purple-700 font-medium hover:underline flex items-center"
            >
              Simulasi <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: AI Financial Advisory & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: AI Advisor & Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Advisor Card */}
          <div className="bg-linear-to-br from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Konsultan Keuangan Koperasi AI</h3>
                  <p className="text-xs text-slate-400">Analisis likuiditas, solvabilitas, dan saran pengelolaan modal</p>
                </div>
              </div>
              <button
                onClick={handleRequestAnalysis}
                disabled={isAnalyzing}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>{aiAnalysis ? 'Perbarui Analisis' : 'Analisis Kesehatan AI'}</span>
                  </>
                )}
              </button>
            </div>

            {analysisError && (
              <div className="mt-4 p-3 rounded-xl bg-red-900/40 border border-red-700/50 text-red-200 text-xs">
                {analysisError}
              </div>
            )}

            {aiAnalysis ? (
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 max-h-72 overflow-y-auto">
                {aiAnalysis}
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <p>Klik tombol untuk memeriksa rasio kas terhadap pinjaman dan rekomendasi alokasi dana.</p>
                <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
                  <ShieldCheck size={14} /> Standar Kemenkop RI
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="font-semibold text-sm text-slate-800 mb-4">Struktur Modal & Simpanan Anggota</h3>
            {totalSimpanan === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <PiggyBank size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Belum ada simpanan terhimpun (Rp 0).</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Daftarkan anggota dan catat simpanan pokok/wajib di Tab Simpanan.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Pokok */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Simpanan Pokok (Modal Awal)</span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(totalSimpananPokok)}{' '}
                      <span className="text-slate-400 text-[11px]">
                        ({totalSimpanan > 0 ? ((totalSimpananPokok / totalSimpanan) * 100).toFixed(1) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${totalSimpanan > 0 ? (totalSimpananPokok / totalSimpanan) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Wajib */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Simpanan Wajib (Iuran Rutin)</span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(totalSimpananWajib)}{' '}
                      <span className="text-slate-400 text-[11px]">
                        ({totalSimpanan > 0 ? ((totalSimpananWajib / totalSimpanan) * 100).toFixed(1) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${totalSimpanan > 0 ? (totalSimpananWajib / totalSimpanan) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Sukarela */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Simpanan Sukarela (Tabungan Fleksibel)</span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(totalSimpananSukarela)}{' '}
                      <span className="text-slate-400 text-[11px]">
                        ({totalSimpanan > 0 ? ((totalSimpananSukarela / totalSimpanan) * 100).toFixed(1) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${totalSimpanan > 0 ? (totalSimpananSukarela / totalSimpanan) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Cash Entries & Fast Links */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-800">Mutasi Kas Terakhir</h3>
                <p className="text-[11px] text-slate-400">Arus kas masuk & keluar terbaru</p>
              </div>
              <button
                onClick={() => onNavigateTab('pembukuan')}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                Buku Kas <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <FileText size={32} className="mb-2 opacity-25" />
                  <p className="text-xs">Belum ada mutasi kas.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan tombol di bawah atau set saldo kas awal.
                  </p>
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                          tx.kategoriKas === 'masuk'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tx.kategoriKas === 'masuk' ? '+' : '-'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{tx.catatan}</p>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatTanggal(tx.tanggal)}</span>
                          <span>•</span>
                          <span className="font-mono">{tx.noBukti}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-bold text-right shrink-0 ${
                        tx.kategoriKas === 'masuk' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {tx.kategoriKas === 'masuk' ? '+' : '-'}
                      {formatRupiah(tx.nominal)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
              <button
                onClick={() => onNavigateTab('anggota')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Users size={14} className="text-slate-500" /> + Anggota
              </button>
              <button
                onClick={() => onNavigateTab('pinjaman')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <HandCoins size={14} className="text-slate-500" /> + Pinjaman
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
