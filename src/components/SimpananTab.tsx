import React, { useState } from 'react';
import {
  PiggyBank,
  PlusCircle,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  Anggota,
  TransaksiSimpanan,
  JenisSimpanan,
  TipeSimpanan,
} from '../types/koperasi';
import { formatRupiah, formatTanggal, getTodayDateString, generateNextId } from '../utils/formatters';

interface SimpananTabProps {
  anggotaList: Anggota[];
  simpananList: TransaksiSimpanan[];
  onAddSimpanan: (tx: TransaksiSimpanan, syncKas: boolean) => void;
}

export const SimpananTab: React.FC<SimpananTabProps> = ({
  anggotaList,
  simpananList,
  onAddSimpanan,
}) => {
  const [viewMode, setViewMode] = useState<'rekap' | 'riwayat'>('rekap');
  const [searchMember, setSearchMember] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('semua');

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    anggotaList[0]?.id || ''
  );
  const [formJenis, setFormJenis] = useState<JenisSimpanan>('wajib');
  const [formTipe, setFormTipe] = useState<TipeSimpanan>('setor');
  const [formNominal, setFormNominal] = useState<number>(100000);
  const [formTanggal, setFormTanggal] = useState<string>(getTodayDateString());
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [syncToKas, setSyncToKas] = useState<boolean>(true);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Overall Totals
  const totalPokok = simpananList
    .filter((s) => s.jenis === 'pokok' && s.tipe === 'setor')
    .reduce((sum, s) => sum + s.nominal, 0);
  const totalWajib = simpananList
    .filter((s) => s.jenis === 'wajib' && s.tipe === 'setor')
    .reduce((sum, s) => sum + s.nominal, 0);
  const totalSukarelaSetor = simpananList
    .filter((s) => s.jenis === 'sukarela' && s.tipe === 'setor')
    .reduce((sum, s) => sum + s.nominal, 0);
  const totalSukarelaTarik = simpananList
    .filter((s) => s.jenis === 'sukarela' && s.tipe === 'tarik')
    .reduce((sum, s) => sum + s.nominal, 0);
  const totalSukarela = Math.max(0, totalSukarelaSetor - totalSukarelaTarik);
  const totalKeseluruhan = totalPokok + totalWajib + totalSukarela;

  // Selected Member calculation for form guidance
  const selectedMember = anggotaList.find((a) => a.id === selectedMemberId);
  const selectedMemberSukarelaSaldo = simpananList
    .filter((s) => s.idAnggota === selectedMemberId && s.jenis === 'sukarela')
    .reduce((sum, s) => (s.tipe === 'setor' ? sum + s.nominal : sum - s.nominal), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || formNominal <= 0) return;

    if (formTipe === 'tarik' && formJenis === 'sukarela' && formNominal > selectedMemberSukarelaSaldo) {
      alert(`Saldo simpanan sukarela ${selectedMember.nama} hanya ${formatRupiah(selectedMemberSukarelaSaldo)}. Penarikan melebihi saldo tidak diizinkan.`);
      return;
    }

    const nextId = generateNextId(
      'SIMP',
      simpananList.map((s) => s.id)
    );

    const catatanDefault =
      formCatatan.trim() ||
      `${formTipe === 'setor' ? 'Setoran' : 'Penarikan'} Simpanan ${formJenis.toUpperCase()} an. ${selectedMember.nama}`;

    const newTx: TransaksiSimpanan = {
      id: nextId,
      idAnggota: selectedMember.id,
      namaAnggota: selectedMember.nama,
      tanggal: formTanggal,
      jenis: formJenis,
      tipe: formTipe,
      nominal: formNominal,
      catatan: catatanDefault,
    };

    onAddSimpanan(newTx, syncToKas);

    setFormSuccessMessage(`Transaksi ${formatRupiah(formNominal)} untuk ${selectedMember.nama} berhasil dicatat.`);
    setTimeout(() => setFormSuccessMessage(null), 4000);

    setFormCatatan('');
  };

  // Member Recap List calculation
  const memberRecap = anggotaList.map((a) => {
    const memberTxs = simpananList.filter((s) => s.idAnggota === a.id);
    const pokok = memberTxs
      .filter((s) => s.jenis === 'pokok' && s.tipe === 'setor')
      .reduce((sum, s) => sum + s.nominal, 0);
    const wajib = memberTxs
      .filter((s) => s.jenis === 'wajib' && s.tipe === 'setor')
      .reduce((sum, s) => sum + s.nominal, 0);
    const sukarelaSetor = memberTxs
      .filter((s) => s.jenis === 'sukarela' && s.tipe === 'setor')
      .reduce((sum, s) => sum + s.nominal, 0);
    const sukarelaTarik = memberTxs
      .filter((s) => s.jenis === 'sukarela' && s.tipe === 'tarik')
      .reduce((sum, s) => sum + s.nominal, 0);
    const sukarela = Math.max(0, sukarelaSetor - sukarelaTarik);
    return {
      anggota: a,
      pokok,
      wajib,
      sukarela,
      total: pokok + wajib + sukarela,
    };
  });

  const filteredRecap = memberRecap.filter((r) => {
    const q = searchMember.toLowerCase();
    return r.anggota.nama.toLowerCase().includes(q) || r.anggota.id.toLowerCase().includes(q);
  });

  // Filtered History
  const filteredHistory = [...simpananList]
    .reverse()
    .filter((s) => {
      const matchSearch =
        s.namaAnggota.toLowerCase().includes(searchMember.toLowerCase()) ||
        s.idAnggota.toLowerCase().includes(searchMember.toLowerCase()) ||
        s.catatan.toLowerCase().includes(searchMember.toLowerCase());
      const matchJenis = filterJenis === 'semua' || s.jenis === filterJenis;
      return matchSearch && matchJenis;
    });

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Simpanan Pokok
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{formatRupiah(totalPokok)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Setoran awal saat mendaftar</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Simpanan Wajib
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{formatRupiah(totalWajib)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Iuran rutin bulanan anggota</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Simpanan Sukarela
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{formatRupiah(totalSukarela)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Dapat ditarik sewaktu-waktu</p>
        </div>

        <div className="bg-emerald-900 text-white rounded-2xl p-4.5 shadow-xs border border-emerald-800">
          <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
            Total Seluruh Simpanan
          </span>
          <h3 className="text-xl font-bold text-emerald-400 mt-1">{formatRupiah(totalKeseluruhan)}</h3>
          <p className="text-[11px] text-slate-300 mt-1">Fondasi modal kerja koperasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Catat Transaksi Simpanan</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <p>{formSuccessMessage}</p>
                </div>
              )}

              {/* Anggota Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Anggota *</label>
                {anggotaList.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                    Belum ada anggota terdaftar. Silakan daftarkan anggota terlebih dahulu di Tab Anggota.
                  </div>
                ) : (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    {anggotaList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama} ({a.id})
                      </option>
                    ))}
                  </select>
                )}
                {selectedMember && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Saldo Sukarela saat ini:{' '}
                    <span className="font-semibold text-slate-700">{formatRupiah(selectedMemberSukarelaSaldo)}</span>
                  </p>
                )}
              </div>

              {/* Jenis Simpanan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Simpanan</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['wajib', 'pokok', 'sukarela'] as JenisSimpanan[]).map((j) => (
                    <button
                      type="button"
                      key={j}
                      onClick={() => {
                        setFormJenis(j);
                        if (j !== 'sukarela') setFormTipe('setor');
                      }}
                      className={`py-2 px-2 rounded-xl font-semibold capitalize transition-all border ${
                        formJenis === j
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipe Transaksi (Setor vs Tarik) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTipe('setor')}
                    className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formTipe === 'setor'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <ArrowDownLeft size={14} className="text-emerald-600" />
                    Setoran Masuk
                  </button>

                  <button
                    type="button"
                    disabled={formJenis !== 'sukarela'}
                    onClick={() => setFormTipe('tarik')}
                    title={formJenis !== 'sukarela' ? 'Hanya Simpanan Sukarela yang dapat ditarik' : ''}
                    className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formJenis !== 'sukarela'
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                        : formTipe === 'tarik'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight size={14} className="text-red-600" />
                    Penarikan
                  </button>
                </div>
                {formJenis !== 'sukarela' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Sesuai UU Koperasi, Simpanan Pokok & Wajib tidak dapat ditarik selama masih menjadi anggota aktif.
                  </p>
                )}
              </div>

              {/* Nominal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  min={1000}
                  step={10000}
                  required
                  value={formNominal}
                  onChange={(e) => setFormNominal(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {/* Quick nominal buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setFormNominal(amt)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-600"
                    >
                      +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Opsional: Keterangan transaksi..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Checkbox Sync to Kas */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="syncKasCheckbox"
                  checked={syncToKas}
                  onChange={(e) => setSyncToKas(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="syncKasCheckbox" className="text-xs text-slate-700 cursor-pointer">
                  Sinkronkan otomatis ke <span className="font-semibold">Buku Kas Umum</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={anggotaList.length === 0}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-xs transition-colors"
              >
                Simpan Transaksi Simpanan
              </button>
            </form>
          </div>
        </div>

        {/* Right: Table Views (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Mode Switcher and Search */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setViewMode('rekap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'rekap' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Saldo per Anggota
              </button>
              <button
                onClick={() => setViewMode('riwayat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'riwayat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Riwayat Mutasi Simpanan
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              {viewMode === 'riwayat' && (
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="semua">Semua Jenis</option>
                  <option value="pokok">Simpanan Pokok</option>
                  <option value="wajib">Simpanan Wajib</option>
                  <option value="sukarela">Simpanan Sukarela</option>
                </select>
              )}

              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {viewMode === 'rekap' ? (
              /* Rekap Saldo Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Anggota</th>
                      <th className="py-3 px-4 text-right">Simpanan Pokok</th>
                      <th className="py-3 px-4 text-right">Simpanan Wajib</th>
                      <th className="py-3 px-4 text-right">Simpanan Sukarela</th>
                      <th className="py-3 px-4 text-right">Total Akumulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRecap.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <p className="text-sm font-medium text-slate-600">Belum ada data. Silakan tambah data baru.</p>
                          <p className="text-[11px] text-slate-400 mt-1">Daftarkan anggota dan catat simpanan untuk melihat rekap saldo.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRecap.map((r) => (
                        <tr key={r.anggota.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{r.anggota.nama}</div>
                            <div className="text-[10px] font-mono text-slate-400">{r.anggota.id}</div>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(r.pokok)}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(r.wajib)}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(r.sukarela)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {formatRupiah(r.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Riwayat Mutasi Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Anggota</th>
                      <th className="py-3 px-4">Jenis</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                      <th className="py-3 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <p className="text-sm font-medium text-slate-600">Belum ada data. Silakan tambah data baru.</p>
                          <p className="text-[11px] text-slate-400 mt-1">Transaksi setoran dan penarikan simpanan akan tercatat di sini.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatTanggal(s.tanggal)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{s.namaAnggota}</div>
                            <div className="text-[10px] font-mono text-slate-400">{s.idAnggota}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                s.jenis === 'pokok'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : s.jenis === 'wajib'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {s.jenis}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                s.tipe === 'setor' ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {s.tipe === 'setor' ? '+ Setor' : '- Tarik'}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              s.tipe === 'setor' ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {formatRupiah(s.nominal)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{s.catatan}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
