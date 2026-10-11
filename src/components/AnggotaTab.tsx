import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  CreditCard,
  PiggyBank,
  HandCoins,
  ShieldAlert,
} from 'lucide-react';
import {
  Anggota,
  TransaksiSimpanan,
  Pinjaman,
  Angsuran,
  TransaksiKas,
} from '../types/koperasi';
import { formatRupiah, formatTanggal, getTodayDateString, generateNextId } from '../utils/formatters';

interface AnggotaTabProps {
  anggotaList: Anggota[];
  simpananList: TransaksiSimpanan[];
  pinjamanList: Pinjaman[];
  angsuranList: Angsuran[];
  onAddAnggota: (anggota: Anggota, simpananPokokNominal?: number) => void;
  onUpdateAnggota: (anggota: Anggota) => void;
  onDeleteAnggota: (id: string) => void;
}

export const AnggotaTab: React.FC<AnggotaTabProps> = ({
  anggotaList,
  simpananList,
  pinjamanList,
  angsuranList,
  onAddAnggota,
  onUpdateAnggota,
  onDeleteAnggota,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formId, setFormId] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formTanggal, setFormTanggal] = useState(getTodayDateString());
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [simpananPokokAwal, setSimpananPokokAwal] = useState<number>(500000);
  const [withSimpananPokok, setWithSimpananPokok] = useState(true);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    const existingIds = anggotaList.map((a) => a.id);
    const nextId = generateNextId('KOP', existingIds);
    setFormId(nextId);
    setFormNama('');
    setFormNoHp('');
    setFormAlamat('');
    setFormTanggal(getTodayDateString());
    setFormStatus('aktif');
    setSimpananPokokAwal(500000);
    setWithSimpananPokok(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (a: Anggota) => {
    setEditingId(a.id);
    setFormId(a.id);
    setFormNama(a.nama);
    setFormNoHp(a.noHp);
    setFormAlamat(a.alamat);
    setFormTanggal(a.tanggalBergabung);
    setFormStatus(a.status);
    setWithSimpananPokok(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formId.trim()) return;

    const anggotaData: Anggota = {
      id: formId.trim().toUpperCase(),
      nama: formNama.trim(),
      noHp: formNoHp.trim() || '-',
      alamat: formAlamat.trim() || '-',
      tanggalBergabung: formTanggal,
      status: formStatus,
    };

    if (editingId) {
      onUpdateAnggota(anggotaData);
    } else {
      onAddAnggota(anggotaData, withSimpananPokok ? simpananPokokAwal : 0);
    }

    setIsModalOpen(false);
  };

  // Helpers to calculate member specific savings & loans
  const getMemberSavings = (memberId: string) => {
    const memberTxs = simpananList.filter((s) => s.idAnggota === memberId);
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
    return { pokok, wajib, sukarela, total: pokok + wajib + sukarela };
  };

  const getMemberLoans = (memberId: string) => {
    const loans = pinjamanList.filter((p) => p.idAnggota === memberId);
    const activeLoans = loans.filter((p) => p.status === 'aktif');
    const totalSisaPokok = activeLoans.reduce((sum, p) => sum + p.sisaPinjamanPokok, 0);
    return { loans, activeLoans, totalSisaPokok };
  };

  // Filtered members
  const filteredAnggota = anggotaList.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.nama.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.noHp.toLowerCase().includes(q) ||
      a.alamat.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Daftar Anggota Koperasi</h2>
            <p className="text-xs text-slate-500">Kelola identitas, riwayat simpanan, dan pinjaman anggota</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, ID, No HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <UserPlus size={15} />
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ID Anggota</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">No. HP & Alamat</th>
                <th className="py-3 px-4">Tgl Bergabung</th>
                <th className="py-3 px-4 text-right">Total Simpanan</th>
                <th className="py-3 px-4 text-right">Sisa Pinjaman</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAnggota.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={36} className="mb-2 opacity-25" />
                      <p className="text-sm font-medium text-slate-600">
                        {anggotaList.length === 0
                          ? 'Belum ada data. Silakan tambah data baru.'
                          : 'Tidak ditemukan data anggota yang sesuai pencarian.'}
                      </p>
                      {anggotaList.length === 0 && (
                        <button
                          onClick={handleOpenAdd}
                          className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <UserPlus size={14} /> Tambah Anggota Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnggota.map((anggota) => {
                  const savings = getMemberSavings(anggota.id);
                  const loans = getMemberLoans(anggota.id);

                  return (
                    <tr key={anggota.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{anggota.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{anggota.nama}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone size={12} className="text-slate-400" />
                          <span>{anggota.noHp}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{anggota.alamat}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatTanggal(anggota.tanggalBergabung)}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">
                        {formatRupiah(savings.total)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {loans.totalSisaPokok > 0 ? (
                          <span className="text-amber-700">{formatRupiah(loans.totalSisaPokok)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            anggota.status === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {anggota.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedAnggota(anggota);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Lihat Buku & Profil Anggota"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(anggota)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Edit Anggota"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus anggota "${anggota.nama}" (${anggota.id})? Transaksi terkait akan tetap berada di sistem.`
                                )
                              ) {
                                onDeleteAnggota(anggota.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Hapus Anggota"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Anggota */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {editingId ? 'Edit Data Anggota' : 'Pendaftaran Anggota Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID Anggota *</label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={formNoHp}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Bergabung</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Merdeka No. 10, RT 01/RW 02, Kota..."
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Simpanan Pokok Awal option for new member */}
              {!editingId && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simpananPokokCheckbox"
                      checked={withSimpananPokok}
                      onChange={(e) => setWithSimpananPokok(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="simpananPokokCheckbox"
                      className="text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      Catat Setoran Simpanan Pokok Awal
                    </label>
                  </div>
                  {withSimpananPokok && (
                    <div className="pl-5 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Nominal: Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={50000}
                          value={simpananPokokAwal}
                          onChange={(e) => setSimpananPokokAwal(Number(e.target.value))}
                          className="w-40 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Otomatis membuat jurnal Kas Masuk & kredit akun Simpanan Pokok.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail / Profil Anggota */}
      {isDetailModalOpen && selectedAnggota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                  {selectedAnggota.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedAnggota.nama}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedAnggota.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Profile Bio */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">No HP</span>
                  <span className="font-semibold text-slate-800">{selectedAnggota.noHp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tgl Gabung</span>
                  <span className="font-semibold text-slate-800">
                    {formatTanggal(selectedAnggota.tanggalBergabung)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                  <span className="font-semibold text-emerald-700 capitalize">{selectedAnggota.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Alamat</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedAnggota.alamat}</span>
                </div>
              </div>

              {/* Savings Breakdown */}
              {(() => {
                const s = getMemberSavings(selectedAnggota.id);
                return (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <PiggyBank size={15} className="text-emerald-600" />
                      Saldo Simpanan Terakumulasi
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-800 font-medium block">Simpanan Pokok</span>
                        <span className="text-sm font-bold text-emerald-950">{formatRupiah(s.pokok)}</span>
                      </div>
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-blue-800 font-medium block">Simpanan Wajib</span>
                        <span className="text-sm font-bold text-blue-950">{formatRupiah(s.wajib)}</span>
                      </div>
                      <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                        <span className="text-[10px] text-purple-800 font-medium block">Simpanan Sukarela</span>
                        <span className="text-sm font-bold text-purple-950">{formatRupiah(s.sukarela)}</span>
                      </div>
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
                        <span className="text-[10px] text-slate-400 font-medium block">Total Keseluruhan</span>
                        <span className="text-sm font-bold text-emerald-400">{formatRupiah(s.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Loan Breakdown */}
              {(() => {
                const l = getMemberLoans(selectedAnggota.id);
                return (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <HandCoins size={15} className="text-amber-600" />
                      Riwayat & Status Pinjaman ({l.loans.length})
                    </h4>
                    {l.loans.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        Anggota ini belum pernah mengajukan pinjaman.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {l.loans.map((pinj) => (
                          <div
                            key={pinj.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800">{pinj.id}</span>
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                    pinj.status === 'aktif'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {pinj.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{pinj.tujuan}</p>
                            </div>

                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px]">Plafon Pinjaman</span>
                              <span className="font-bold text-slate-900">{formatRupiah(pinj.nominalPinjaman)}</span>
                              {pinj.status === 'aktif' && (
                                <span className="text-amber-700 block text-[11px] font-semibold">
                                  Sisa Pokok: {formatRupiah(pinj.sisaPinjamanPokok)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup Profil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
