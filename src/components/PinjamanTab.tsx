import React, { useState } from 'react';
import {
  HandCoins,
  PlusCircle,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Receipt,
  Search,
} from 'lucide-react';
import {
  Anggota,
  Pinjaman,
  Angsuran,
} from '../types/koperasi';
import { formatRupiah, formatTanggal, getTodayDateString, generateNextId } from '../utils/formatters';

interface PinjamanTabProps {
  anggotaList: Anggota[];
  pinjamanList: Pinjaman[];
  angsuranList: Angsuran[];
  onAddPinjaman: (p: Pinjaman, syncKas: boolean) => void;
  onPayAngsuran: (a: Angsuran, updatedPinjaman: Pinjaman) => void;
}

export const PinjamanTab: React.FC<PinjamanTabProps> = ({
  anggotaList,
  pinjamanList,
  angsuranList,
  onAddPinjaman,
  onPayAngsuran,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'lunas'>('semua');

  // Form New Loan
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    anggotaList[0]?.id || ''
  );
  const [nominalPinjaman, setNominalPinjaman] = useState<number>(5000000);
  const [tenorBulan, setTenorBulan] = useState<number>(10);
  const [bungaPersenTahun, setBungaPersenTahun] = useState<number>(12); // 1% per bulan
  const [tanggalPengajuan, setTanggalPengajuan] = useState<string>(getTodayDateString());
  const [tujuanPinjaman, setTujuanPinjaman] = useState<string>('Modal Usaha / Tambahan Usaha');
  const [syncKasPencairan, setSyncKasPencairan] = useState<boolean>(true);
  const [loanSuccessMsg, setLoanSuccessMsg] = useState<string | null>(null);

  // Modal State for Paying Installment
  const [selectedPinjamanForPayment, setSelectedPinjamanForPayment] = useState<Pinjaman | null>(null);
  const [angsuranPokokInput, setAngsuranPokokInput] = useState<number>(0);
  const [angsuranBungaInput, setAngsuranBungaInput] = useState<number>(0);
  const [angsuranTanggalBayar, setAngsuranTanggalBayar] = useState<string>(getTodayDateString());
  const [angsuranKeterangan, setAngsuranKeterangan] = useState<string>('');

  // Modal State for Viewing Loan Card (Kartu Angsuran)
  const [selectedPinjamanForCard, setSelectedPinjamanForCard] = useState<Pinjaman | null>(null);

  // Calculations for Loan Simulation
  const totalBunga = Math.round((nominalPinjaman * (bungaPersenTahun / 100) * tenorBulan) / 12);
  const totalHarusDibayar = nominalPinjaman + totalBunga;
  const angsuranPokokPerBulan = Math.round(nominalPinjaman / tenorBulan);
  const angsuranBungaPerBulan = Math.round(totalBunga / tenorBulan);
  const totalAngsuranPerBulan = angsuranPokokPerBulan + angsuranBungaPerBulan;

  // Global Loan Stats
  const totalDisalurkan = pinjamanList.reduce((sum, p) => sum + p.nominalPinjaman, 0);
  const totalPokokTerbayar = angsuranList.reduce((sum, a) => sum + a.pokokDibayar, 0);
  const totalBungaTerbayar = angsuranList.reduce((sum, a) => sum + a.bungaDibayar, 0);
  const sisaPiutangBerjalan = pinjamanList
    .filter((p) => p.status === 'aktif')
    .reduce((sum, p) => sum + p.sisaPinjamanPokok, 0);

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const member = anggotaList.find((a) => a.id === selectedMemberId);
    if (!member || nominalPinjaman <= 0 || tenorBulan <= 0) return;

    const nextId = generateNextId(
      'PINJ',
      pinjamanList.map((p) => p.id)
    );

    const newPinjaman: Pinjaman = {
      id: nextId,
      idAnggota: member.id,
      namaAnggota: member.nama,
      tanggalPengajuan,
      nominalPinjaman,
      tenorBulan,
      bungaPersenTahun,
      totalBunga,
      totalHarusDibayar,
      angsuranPokokPerBulan,
      angsuranBungaPerBulan,
      totalAngsuranPerBulan,
      sisaPinjamanPokok: nominalPinjaman,
      sisaTotalTagihan: totalHarusDibayar,
      status: 'aktif',
      tujuan: tujuanPinjaman.trim() || 'Pinjaman Anggota Koperasi',
    };

    onAddPinjaman(newPinjaman, syncKasPencairan);

    setLoanSuccessMsg(`Pinjaman ${nextId} sebesar ${formatRupiah(nominalPinjaman)} berhasil disetujui & dicatat.`);
    setTimeout(() => setLoanSuccessMsg(null), 4000);
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (p: Pinjaman) => {
    setSelectedPinjamanForPayment(p);
    setAngsuranPokokInput(p.angsuranPokokPerBulan);
    setAngsuranBungaInput(p.angsuranBungaPerBulan);
    setAngsuranTanggalBayar(getTodayDateString());
    setAngsuranKeterangan(`Pembayaran Angsuran ${p.id} an. ${p.namaAnggota}`);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPinjamanForPayment) return;

    const nextAngsuranId = generateNextId(
      'ANG',
      angsuranList.map((a) => a.id)
    );

    const loanInstallments = angsuranList.filter((a) => a.idPinjaman === selectedPinjamanForPayment.id);
    const angsuranKe = loanInstallments.length + 1;

    const newAngsuran: Angsuran = {
      id: nextAngsuranId,
      idPinjaman: selectedPinjamanForPayment.id,
      idAnggota: selectedPinjamanForPayment.idAnggota,
      namaAnggota: selectedPinjamanForPayment.namaAnggota,
      angsuranKe,
      tanggalBayar: angsuranTanggalBayar,
      pokokDibayar: angsuranPokokInput,
      bungaDibayar: angsuranBungaInput,
      totalDibayar: angsuranPokokInput + angsuranBungaInput,
      keterangan: angsuranKeterangan,
    };

    const newSisaPokok = Math.max(0, selectedPinjamanForPayment.sisaPinjamanPokok - angsuranPokokInput);
    const newSisaTagihan = Math.max(
      0,
      selectedPinjamanForPayment.sisaTotalTagihan - (angsuranPokokInput + angsuranBungaInput)
    );

    const updatedPinjaman: Pinjaman = {
      ...selectedPinjamanForPayment,
      sisaPinjamanPokok: newSisaPokok,
      sisaTotalTagihan: newSisaTagihan,
      status: newSisaPokok === 0 ? 'lunas' : 'aktif',
    };

    onPayAngsuran(newAngsuran, updatedPinjaman);
    setSelectedPinjamanForPayment(null);
  };

  // Filtered Loans
  const filteredLoans = pinjamanList.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.namaAnggota.toLowerCase().includes(q) ||
      p.idAnggota.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'semua' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Plafon Disalurkan
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{formatRupiah(totalDisalurkan)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">{pinjamanList.length} berkas pinjaman disetujui</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pokok Telah Terbayar
          </span>
          <h3 className="text-xl font-bold text-emerald-700 mt-1">{formatRupiah(totalPokokTerbayar)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Kembali ke kas likuid koperasi</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Sisa Piutang Berjalan
          </span>
          <h3 className="text-xl font-bold text-amber-700 mt-1">{formatRupiah(sisaPiutangBerjalan)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {pinjamanList.filter((p) => p.status === 'aktif').length} pinjaman masih aktif
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pendapatan Jasa / Bunga
          </span>
          <h3 className="text-xl font-bold text-purple-700 mt-1">{formatRupiah(totalBungaTerbayar)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Sumber utama pembagian SHU</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Loan Application Form (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Form Pengajuan Pinjaman</h3>
              </div>
            </div>

            <form onSubmit={handleCreateLoan} className="p-5 space-y-4 text-xs">
              {loanSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <p>{loanSuccessMsg}</p>
                </div>
              )}

              {/* Anggota Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Anggota Peminjam *</label>
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
              </div>

              {/* Nominal Pinjaman */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Pinjaman (Rp) *</label>
                <input
                  type="number"
                  min={500000}
                  step={500000}
                  required
                  value={nominalPinjaman}
                  onChange={(e) => setNominalPinjaman(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[2000000, 5000000, 10000000, 15000000, 20000000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setNominalPinjaman(amt)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-600"
                    >
                      {amt / 1000000}jt
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenor & Bunga Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenor (Bulan) *</label>
                  <select
                    value={tenorBulan}
                    onChange={(e) => setTenorBulan(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {[3, 6, 10, 12, 18, 24].map((t) => (
                      <option key={t} value={t}>
                        {t} Bulan ({Math.round(t / 12 * 10) / 10} th)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bunga (% / Tahun)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      value={bungaPersenTahun}
                      onChange={(e) => setBungaPersenTahun(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    ≈ {(bungaPersenTahun / 12).toFixed(2)}% per bulan
                  </span>
                </div>
              </div>

              {/* Live Installment Breakdown Card */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Simulasi Cicilan Angsuran
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Pokok / bln:</span>
                    <span className="font-semibold text-slate-800">{formatRupiah(angsuranPokokPerBulan)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Jasa Bunga / bln:</span>
                    <span className="font-semibold text-slate-800">{formatRupiah(angsuranBungaPerBulan)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">Total Angsuran / Bulan:</span>
                  <span className="text-sm font-extrabold text-emerald-700">{formatRupiah(totalAngsuranPerBulan)}</span>
                </div>
              </div>

              {/* Tanggal & Tujuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Cair</label>
                  <input
                    type="date"
                    value={tanggalPengajuan}
                    onChange={(e) => setTanggalPengajuan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tujuan Pinjaman</label>
                  <input
                    type="text"
                    placeholder="Contoh: Beli mesin"
                    value={tujuanPinjaman}
                    onChange={(e) => setTujuanPinjaman(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Sync to Kas */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="syncKasPencairanCheckbox"
                  checked={syncKasPencairan}
                  onChange={(e) => setSyncKasPencairan(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="syncKasPencairanCheckbox" className="text-xs text-slate-700 cursor-pointer">
                  Catat pencairan sebagai <span className="font-semibold">Kas Keluar</span> di Buku Kas
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
              >
                Setujui & Cairkan Pinjaman
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active & Completed Loans Table (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('semua')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'semua' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Semua Pinjaman ({pinjamanList.length})
              </button>
              <button
                onClick={() => setFilterStatus('aktif')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'aktif' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sedang Berjalan ({pinjamanList.filter((p) => p.status === 'aktif').length})
              </button>
              <button
                onClick={() => setFilterStatus('lunas')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'lunas' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Lunas ({pinjamanList.filter((p) => p.status === 'lunas').length})
              </button>
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / ID pinjaman..."
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
                    <th className="py-3 px-4">Pinjaman</th>
                    <th className="py-3 px-4">Peminjam</th>
                    <th className="py-3 px-4 text-right">Plafon & Tenor</th>
                    <th className="py-3 px-4 text-right">Sisa Pokok</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Tidak ada data pinjaman yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div>{p.id}</div>
                          <div className="text-[10px] font-sans text-slate-400 font-normal">
                            {formatTanggal(p.tanggalPengajuan)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.namaAnggota}</div>
                          <div className="text-[10px] text-slate-400">{p.tujuan}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-slate-900">{formatRupiah(p.nominalPinjaman)}</div>
                          <div className="text-[10px] text-slate-400">{p.tenorBulan} bln ({formatRupiah(p.totalAngsuranPerBulan)}/bln)</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status === 'aktif' ? (
                            <span className="font-bold text-amber-700">{formatRupiah(p.sisaPinjamanPokok)}</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Lunas</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'aktif'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {p.status === 'aktif' && (
                              <button
                                onClick={() => handleOpenPaymentModal(p)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-xs"
                                title="Bayar Angsuran Bulanan"
                              >
                                <Receipt size={12} /> Bayar
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedPinjamanForCard(p)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                              title="Lihat Kartu Angsuran & Rincian Cicilan"
                            >
                              <Eye size={12} /> Kartu
                            </button>
                          </div>
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

      {/* Modal Bayar Angsuran */}
      {selectedPinjamanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Pembayaran Angsuran Pinjaman</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedPinjamanForPayment.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPinjamanForPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] block">Anggota</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedPinjamanForPayment.namaAnggota}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Sisa Pokok</span>
                  <span className="font-bold text-amber-700 text-sm">
                    {formatRupiah(selectedPinjamanForPayment.sisaPinjamanPokok)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Porsi Pokok (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={angsuranPokokInput}
                    onChange={(e) => setAngsuranPokokInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Porsi Bunga / Jasa (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    required
                    value={angsuranBungaInput}
                    onChange={(e) => setAngsuranBungaInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Total Dibayar:</span>
                <span className="text-base font-extrabold text-emerald-800">
                  {formatRupiah(angsuranPokokInput + angsuranBungaInput)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Bayar</label>
                <input
                  type="date"
                  value={angsuranTanggalBayar}
                  onChange={(e) => setAngsuranTanggalBayar(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Transaksi</label>
                <input
                  type="text"
                  value={angsuranKeterangan}
                  onChange={(e) => setAngsuranKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                * Pembayaran angsuran ini otomatis mengurangi saldo piutang dan dicatat sebagai kas masuk di Buku Kas Umum.
              </p>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPinjamanForPayment(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Proses Angsuran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kartu Angsuran / Installment Card Breakdown */}
      {selectedPinjamanForCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Kartu Angsuran Pinjaman: {selectedPinjamanForCard.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Peminjam: <span className="font-semibold text-slate-700">{selectedPinjamanForCard.namaAnggota}</span> ({selectedPinjamanForCard.idAnggota})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPinjamanForCard(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Summary Stats of This Loan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Plafon Pinjaman</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatRupiah(selectedPinjamanForCard.nominalPinjaman)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Bunga ({selectedPinjamanForCard.bungaPersenTahun}%)</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatRupiah(selectedPinjamanForCard.totalBunga)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Tenor</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedPinjamanForCard.tenorBulan} Bulan
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Sisa Pokok</span>
                  <span className="font-extrabold text-amber-700 text-sm">
                    {formatRupiah(selectedPinjamanForCard.sisaPinjamanPokok)}
                  </span>
                </div>
              </div>

              {/* Installment History Table */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2.5">Riwayat Pembayaran Angsuran</h4>
                {(() => {
                  const installments = angsuranList.filter(
                    (a) => a.idPinjaman === selectedPinjamanForCard.id
                  );

                  if (installments.length === 0) {
                    return (
                      <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        Belum ada pembayaran angsuran untuk pinjaman ini.
                      </p>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Ke</th>
                            <th className="py-2.5 px-3">Tgl Bayar</th>
                            <th className="py-2.5 px-3 text-right">Pokok</th>
                            <th className="py-2.5 px-3 text-right">Bunga</th>
                            <th className="py-2.5 px-3 text-right">Total Bayar</th>
                            <th className="py-2.5 px-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {installments.map((inst) => (
                            <tr key={inst.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold font-mono">#{inst.angsuranKe}</td>
                              <td className="py-2.5 px-3 text-slate-500">{formatTanggal(inst.tanggalBayar)}</td>
                              <td className="py-2.5 px-3 text-right text-slate-800">{formatRupiah(inst.pokokDibayar)}</td>
                              <td className="py-2.5 px-3 text-right text-purple-700">{formatRupiah(inst.bungaDibayar)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                {formatRupiah(inst.totalDibayar)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{inst.keterangan}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPinjamanForCard(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup Kartu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
