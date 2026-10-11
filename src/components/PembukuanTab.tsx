import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  PlusCircle,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Copy,
  AlertCircle,
  FileText,
  Upload,
  Coins,
  Receipt,
  FileCode,
} from 'lucide-react';
import {
  Anggota,
  TransaksiKas,
  TipeTransaksiKas,
} from '../types/koperasi';
import { formatRupiah, formatTanggal, getTodayDateString, generateNextId } from '../utils/formatters';

interface PembukuanTabProps {
  anggotaList: Anggota[];
  kasList: TransaksiKas[];
  onAddTransaksiKas: (tx: TransaksiKas) => void;
}

export const PembukuanTab: React.FC<PembukuanTabProps> = ({
  anggotaList,
  kasList,
  onAddTransaksiKas,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'manual'>('ai');
  const [filterKategori, setFilterKategori] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Assistant States
  const [aiInputText, setAiInputText] = useState('');
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [aiSuccessPosted, setAiSuccessPosted] = useState<string | null>(null);

  // Manual Form States
  const [manualTanggal, setManualTanggal] = useState(getTodayDateString());
  const [manualNoBukti, setManualNoBukti] = useState('');
  const [manualTipe, setManualTipe] = useState<TipeTransaksiKas>('operasional_beban');
  const [manualKategori, setManualKategori] = useState<'masuk' | 'keluar'>('keluar');
  const [manualDebit, setManualDebit] = useState('Beban Operasional');
  const [manualKredit, setManualKredit] = useState('Kas/Bank');
  const [manualNominal, setManualNominal] = useState<number>(100000);
  const [manualMemberId, setManualMemberId] = useState<string>('');
  const [manualCatatan, setManualCatatan] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // AI Process Handler
  const handleProcessAi = async () => {
    if (!aiInputText.trim() && !aiImageBase64) return;

    setIsAiProcessing(true);
    setAiError(null);
    setParsedResult(null);
    setAiSuccessPosted(null);

    try {
      const response = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiInputText,
          imageBase64: aiImageBase64,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses transaksi dengan AI.');
      }

      setParsedResult(data);
    } catch (err: any) {
      setAiError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Image upload handler for AI receipt scanning
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAiImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Post AI Result to Cash Ledger
  const handlePostAiToLedger = () => {
    if (!parsedResult) return;

    const nextId = generateNextId(
      'KAS',
      kasList.map((k) => k.id)
    );

    const isMasuk =
      parsedResult.jurnal?.debit?.toLowerCase().includes('kas') ||
      parsedResult.tipe_transaksi?.includes('simpanan') ||
      parsedResult.tipe_transaksi === 'angsuran' ||
      parsedResult.tipe_transaksi === 'operasional_pendapatan';

    const newTx: TransaksiKas = {
      id: nextId,
      tanggal: parsedResult.tanggal || getTodayDateString(),
      noBukti: isMasuk ? `BKM-${nextId.split('-')[1]}` : `BKK-${nextId.split('-')[1]}`,
      tipeTransaksi: (parsedResult.tipe_transaksi as TipeTransaksiKas) || 'lainnya',
      idAnggota: parsedResult.id_anggota || null,
      namaAnggota: parsedResult.nama_anggota || null,
      debitAkun: parsedResult.jurnal?.debit || 'Kas/Bank',
      kreditAkun: parsedResult.jurnal?.kredit || 'Pendapatan Operasional',
      nominal: Number(parsedResult.nominal) || 0,
      kategoriKas: isMasuk ? 'masuk' : 'keluar',
      catatan: parsedResult.catatan || 'Transaksi via AI Smart Journaling',
    };

    onAddTransaksiKas(newTx);
    setAiSuccessPosted(`Berhasil diposting ke Buku Kas dengan nomor bukti ${newTx.noBukti}!`);
    setParsedResult(null);
    setAiInputText('');
    setAiImageBase64(null);
  };

  // Manual Form Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualNominal <= 0) return;

    const nextId = generateNextId(
      'KAS',
      kasList.map((k) => k.id)
    );

    const bukti =
      manualNoBukti.trim() ||
      (manualKategori === 'masuk' ? `BKM-${nextId.split('-')[1]}` : `BKK-${nextId.split('-')[1]}`);

    const member = anggotaList.find((a) => a.id === manualMemberId);

    const newTx: TransaksiKas = {
      id: nextId,
      tanggal: manualTanggal,
      noBukti: bukti,
      tipeTransaksi: manualTipe,
      idAnggota: member ? member.id : null,
      namaAnggota: member ? member.nama : null,
      debitAkun: manualDebit.trim() || (manualKategori === 'masuk' ? 'Kas/Bank' : 'Beban Operasional'),
      kreditAkun: manualKredit.trim() || (manualKategori === 'masuk' ? 'Pendapatan Lain-lain' : 'Kas/Bank'),
      nominal: manualNominal,
      kategoriKas: manualKategori,
      catatan: manualCatatan.trim() || 'Transaksi kas manual',
    };

    onAddTransaksiKas(newTx);
    setManualSuccessMsg(`Transaksi ${formatRupiah(manualNominal)} berhasil dicatat di Buku Kas.`);
    setTimeout(() => setManualSuccessMsg(null), 4000);

    setManualCatatan('');
    setManualNoBukti('');
  };

  // Calculate Running Balances for Ledger
  let runningBalance = 0;
  const ledgerEntriesWithBalance = kasList.map((tx) => {
    if (tx.kategoriKas === 'masuk') {
      runningBalance += tx.nominal;
    } else if (tx.kategoriKas === 'keluar') {
      runningBalance -= tx.nominal;
    }
    return {
      ...tx,
      saldoBerjalan: runningBalance,
    };
  });

  const totalMasuk = kasList
    .filter((k) => k.kategoriKas === 'masuk')
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalKeluar = kasList
    .filter((k) => k.kategoriKas === 'keluar')
    .reduce((sum, k) => sum + k.nominal, 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  // Filtered Ledger List
  const filteredLedger = [...ledgerEntriesWithBalance]
    .reverse()
    .filter((k) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        k.catatan.toLowerCase().includes(q) ||
        k.noBukti.toLowerCase().includes(q) ||
        (k.namaAnggota && k.namaAnggota.toLowerCase().includes(q)) ||
        k.debitAkun.toLowerCase().includes(q) ||
        k.kreditAkun.toLowerCase().includes(q);

      const matchKategori = filterKategori === 'semua' || k.kategoriKas === filterKategori;
      return matchSearch && matchKategori;
    });

  return (
    <div className="space-y-6">
      {/* 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Kas Masuk
            </span>
            <h3 className="text-xl font-bold text-emerald-700 mt-1">{formatRupiah(totalMasuk)}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Semua penerimaan kas</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Kas Keluar
            </span>
            <h3 className="text-xl font-bold text-red-600 mt-1">{formatRupiah(totalKeluar)}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Pencairan & operasional</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="bg-emerald-900 text-white rounded-2xl p-4.5 shadow-xs border border-emerald-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Saldo Akhir Kas Koperasi
            </span>
            <h3 className="text-xl font-bold text-emerald-400 mt-1">{formatRupiah(saldoAkhir)}</h3>
            <p className="text-[11px] text-slate-300 mt-0.5">Kas riil siap pakai</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center">
            <Coins size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: AI Journaling & Manual Input (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Sub-tab selection */}
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('ai')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'ai'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Sparkles size={14} /> Asisten AI Cerdas
              </button>
              <button
                onClick={() => setActiveSubTab('manual')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'manual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <PlusCircle size={14} /> Input Manual
              </button>
            </div>

            {/* Mode 1: AI Smart Journaling */}
            {activeSubTab === 'ai' && (
              <div className="p-5 space-y-4 text-xs">
                {aiSuccessPosted && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <p>{aiSuccessPosted}</p>
                  </div>
                )}

                {aiError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-600" />
                    <p>{aiError}</p>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deskripsi Transaksi / Kalimat Alami
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Contoh: Budi Santoso (KOP-001) bayar simpanan wajib Rp 100.000 via transfer bank Mandiri hari ini."
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    disabled={isAiProcessing}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed text-xs"
                  />
                </div>

                {/* Optional Receipt Image Upload */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Atau Unggah Foto Struk / Kuitansi (Opsional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 p-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors">
                      <Upload size={14} />
                      <span className="text-[11px] font-medium">Pilih berkas foto struk</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {aiImageBase64 && (
                      <button
                        onClick={() => setAiImageBase64(null)}
                        className="text-red-500 text-[11px] underline hover:text-red-700"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>
                  {aiImageBase64 && (
                    <div className="mt-2 text-[10px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Gambar struk siap diproses
                    </div>
                  )}
                </div>

                {/* Quick Examples Buttons */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase">
                    Coba Contoh Transaksi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Siti Aminah setor simpanan sukarela Rp 500.000 cash.',
                      'Ahmad Fauzi bayar angsuran pinjaman pokok 1jt dan bunga 50rb.',
                      'Beli ATK dan konsumsi rapat pengurus Rp 150.000.',
                    ].map((sample, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setAiInputText(sample)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] transition-colors"
                      >
                        {sample.slice(0, 28)}...
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProcessAi}
                  disabled={isAiProcessing || (!aiInputText.trim() && !aiImageBase64)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isAiProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menganalisis & Menjurnal Otomatis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Ekstrak & Buat Jurnal Otomatis</span>
                    </>
                  )}
                </button>

                {/* Parsed Result Display */}
                {parsedResult && (
                  <div className="mt-4 p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> Hasil Ekstraksi Standar PSAK Koperasi
                      </span>
                      <span className="text-xs font-extrabold text-emerald-900">
                        {formatRupiah(parsedResult.nominal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-emerald-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Tanggal:</span>
                        <span className="font-semibold text-slate-800">{formatTanggal(parsedResult.tanggal)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Tipe:</span>
                        <span className="font-semibold text-slate-800 uppercase">{parsedResult.tipe_transaksi}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Anggota:</span>
                        <span className="font-semibold text-slate-800">
                          {parsedResult.nama_anggota || '-'} {parsedResult.id_anggota ? `(${parsedResult.id_anggota})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Keterangan:</span>
                        <span className="font-medium text-slate-700 truncate block">{parsedResult.catatan}</span>
                      </div>
                    </div>

                    {/* Debit & Credit Journal */}
                    <div className="bg-slate-900 text-white p-3 rounded-lg space-y-1.5 font-mono text-[11px]">
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                        Entri Jurnal Berpasangan:
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-400">(D) {parsedResult.jurnal?.debit}</span>
                        <span>{formatRupiah(parsedResult.nominal)}</span>
                      </div>
                      <div className="flex justify-between pl-4 text-slate-300">
                        <span>(K) {parsedResult.jurnal?.kredit}</span>
                        <span>{formatRupiah(parsedResult.nominal)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePostAiToLedger}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <CheckCircle2 size={14} /> Posting ke Buku Kas
                      </button>
                    </div>

                    {/* Raw JSON viewer */}
                    <details className="pt-1 text-[11px]">
                      <summary className="text-slate-500 hover:text-slate-700 cursor-pointer font-medium">
                        Lihat Data JSON Mentah (Output WAJIB)
                      </summary>
                      <pre className="mt-2 p-2.5 bg-slate-800 text-slate-200 rounded-lg text-[10px] overflow-x-auto">
                        {JSON.stringify(parsedResult, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Manual Cash Transaction Input */}
            {activeSubTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="p-5 space-y-4 text-xs">
                {manualSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <p>{manualSuccessMsg}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={manualTanggal}
                      onChange={(e) => setManualTanggal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">No. Bukti (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: BKM-015"
                      value={manualNoBukti}
                      onChange={(e) => setManualNoBukti(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kategori Kas</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setManualKategori('masuk');
                          setManualDebit('Kas/Bank');
                          setManualKredit('Pendapatan Operasional Lain');
                          setManualTipe('operasional_pendapatan');
                        }}
                        className={`py-1.5 rounded-lg font-bold border transition-all ${
                          manualKategori === 'masuk'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Kas Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualKategori('keluar');
                          setManualDebit('Beban Operasional');
                          setManualKredit('Kas/Bank');
                          setManualTipe('operasional_beban');
                        }}
                        className={`py-1.5 rounded-lg font-bold border transition-all ${
                          manualKategori === 'keluar'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Kas Keluar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tipe Transaksi</label>
                    <select
                      value={manualTipe}
                      onChange={(e) => setManualTipe(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="operasional_beban">Beban Operasional</option>
                      <option value="operasional_pendapatan">Pendapatan Operasional</option>
                      <option value="simpanan_wajib">Simpanan Wajib</option>
                      <option value="simpanan_sukarela">Simpanan Sukarela</option>
                      <option value="angsuran">Angsuran Pinjaman</option>
                      <option value="lainnya">Lain-lain</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Akun Debit *</label>
                    <input
                      type="text"
                      required
                      value={manualDebit}
                      onChange={(e) => setManualDebit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Akun Kredit *</label>
                    <input
                      type="text"
                      required
                      value={manualKredit}
                      onChange={(e) => setManualKredit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    min={1000}
                    step={10000}
                    required
                    value={manualNominal}
                    onChange={(e) => setManualNominal(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Anggota (Opsional)</label>
                  <select
                    value={manualMemberId}
                    onChange={(e) => setManualMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- Non-Anggota / Operasional Umum --</option>
                    {anggotaList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama} ({a.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Keterangan Transaksi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembelian tinta printer dan kertas HVS"
                    value={manualCatatan}
                    onChange={(e) => setManualCatatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Simpan ke Buku Kas Umum
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right: General Cash Ledger Table (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterKategori('semua')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterKategori === 'semua' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Semua Mutasi ({kasList.length})
              </button>
              <button
                onClick={() => setFilterKategori('masuk')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterKategori === 'masuk' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Kas Masuk
              </button>
              <button
                onClick={() => setFilterKategori('keluar')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterKategori === 'keluar' ? 'bg-white text-red-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Kas Keluar
              </button>
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari bukti, akun, catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Tanggal / Bukti</th>
                    <th className="py-3 px-3">Akun Jurnal (D / K)</th>
                    <th className="py-3 px-3 text-right">Kas Masuk</th>
                    <th className="py-3 px-3 text-right">Kas Keluar</th>
                    <th className="py-3 px-3 text-right">Saldo Kas</th>
                    <th className="py-3 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada entri buku kas yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{formatTanggal(tx.tanggal)}</div>
                          <div className="font-mono text-[10px] text-slate-400">{tx.noBukti}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 text-[11px]">(D) {tx.debitAkun}</div>
                          <div className="text-[10px] text-slate-500 pl-2">(K) {tx.kreditAkun}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">
                          {tx.kategoriKas === 'masuk' ? formatRupiah(tx.nominal) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-600">
                          {tx.kategoriKas === 'keluar' ? formatRupiah(tx.nominal) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(tx.saldoBerjalan)}
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="text-slate-800 truncate">{tx.catatan}</div>
                          {tx.namaAnggota && (
                            <div className="text-[10px] text-emerald-700 font-medium">
                              An: {tx.namaAnggota}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
