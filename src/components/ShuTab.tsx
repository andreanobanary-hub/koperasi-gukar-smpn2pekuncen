import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Percent,
  Download,
  Info,
  CheckCircle2,
  PieChart,
  Users,
  Coins,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Anggota,
  TransaksiSimpanan,
  Pinjaman,
  Angsuran,
  TransaksiKas,
  ShuConfig,
  HasilPerhitunganShu,
} from '../types/koperasi';
import { formatRupiah } from '../utils/formatters';
import { exportToCsv } from '../utils/exportHelpers';

interface ShuTabProps {
  anggotaList: Anggota[];
  simpananList: TransaksiSimpanan[];
  pinjamanList: Pinjaman[];
  angsuranList: Angsuran[];
  kasList: TransaksiKas[];
  shuConfig: ShuConfig;
  onUpdateShuConfig: (config: ShuConfig) => void;
}

export const ShuTab: React.FC<ShuTabProps> = ({
  anggotaList,
  simpananList,
  pinjamanList,
  angsuranList,
  kasList,
  shuConfig,
  onUpdateShuConfig,
}) => {
  // Config state
  const [persenModal, setPersenModal] = useState(shuConfig.persentaseJasaModal);
  const [persenUsaha, setPersenUsaha] = useState(shuConfig.persentaseJasaUsaha);
  const [persenCadangan, setPersenCadangan] = useState(shuConfig.persentaseDanaCadangan);
  const [persenPengurus, setPersenPengurus] = useState(shuConfig.persentaseDanaPengurus);
  const [persenSosial, setPersenSosial] = useState(shuConfig.persentaseDanaSosial);
  const [isConfigSaved, setIsConfigSaved] = useState(false);

  // 1. Calculate Real Revenues & Expenses from the system
  const totalBungaDiterima = angsuranList.reduce((sum, a) => sum + a.bungaDibayar, 0);
  const totalPendapatanLain = kasList
    .filter((k) => k.tipeTransaksi === 'operasional_pendapatan' && k.kreditAkun !== 'Modal Awal Koperasi')
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalBebanOperasional = kasList
    .filter((k) => k.tipeTransaksi === 'operasional_beban')
    .reduce((sum, k) => sum + k.nominal, 0);

  const totalPendapatanKotor = totalBungaDiterima + totalPendapatanLain;
  const shuKotorTahunBerjalan = Math.max(0, totalPendapatanKotor - totalBebanOperasional);

  // Pool allocations
  const totalPersen = persenModal + persenUsaha + persenCadangan + persenPengurus + persenSosial;
  const danaJasaModal = Math.round((shuKotorTahunBerjalan * persenModal) / 100);
  const danaJasaUsaha = Math.round((shuKotorTahunBerjalan * persenUsaha) / 100);
  const danaCadangan = Math.round((shuKotorTahunBerjalan * persenCadangan) / 100);
  const danaPengurus = Math.round((shuKotorTahunBerjalan * persenPengurus) / 100);
  const danaSosial = Math.round((shuKotorTahunBerjalan * persenSosial) / 100);

  // 2. Member Aggregates for SHU Distribution
  // Total Savings across all members
  const memberSavingsMap: Record<string, number> = {};
  for (const a of anggotaList) {
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
    memberSavingsMap[a.id] = pokok + wajib + Math.max(0, sukarelaSetor - sukarelaTarik);
  }
  const totalAllSavings = Object.values(memberSavingsMap).reduce((sum, val) => sum + val, 0);

  // Member Loan Activity (Jasa Bunga contributed)
  const memberLoanActivityMap: Record<string, number> = {};
  for (const a of anggotaList) {
    // Interest paid on loans is the direct economic participation of the member in cooperative
    const bungaPaid = angsuranList
      .filter((ang) => ang.idAnggota === a.id)
      .reduce((sum, ang) => sum + ang.bungaDibayar, 0);
    memberLoanActivityMap[a.id] = bungaPaid;
  }
  const totalAllLoanActivity = Object.values(memberLoanActivityMap).reduce((sum, val) => sum + val, 0);

  // 3. Calculate Results per Member
  const hasilPerhitungan: HasilPerhitunganShu[] = anggotaList.map((a) => {
    const simpanan = memberSavingsMap[a.id] || 0;
    const porsiSimpanan = totalAllSavings > 0 ? (simpanan / totalAllSavings) * 100 : 0;
    const shuJasaModal = totalAllSavings > 0 ? Math.round((simpanan / totalAllSavings) * danaJasaModal) : 0;

    const volumeUsaha = memberLoanActivityMap[a.id] || 0;
    const porsiUsaha = totalAllLoanActivity > 0 ? (volumeUsaha / totalAllLoanActivity) * 100 : 0;
    const shuJasaUsaha =
      totalAllLoanActivity > 0 ? Math.round((volumeUsaha / totalAllLoanActivity) * danaJasaUsaha) : 0;

    const totalShu = shuJasaModal + shuJasaUsaha;

    return {
      idAnggota: a.id,
      namaAnggota: a.nama,
      totalSimpanan: simpanan,
      persentaseSimpanan: porsiSimpanan,
      shuJasaModal,
      totalPinjamanDanBunga: volumeUsaha,
      persentaseUsaha: porsiUsaha,
      shuJasaUsaha,
      totalShuDiterima: totalShu,
    };
  });

  const handleSaveConfig = () => {
    const newConfig: ShuConfig = {
      ...shuConfig,
      persentaseJasaModal: persenModal,
      persentaseJasaUsaha: persenUsaha,
      persentaseDanaCadangan: persenCadangan,
      persentaseDanaPengurus: persenPengurus,
      persentaseDanaSosial: persenSosial,
    };
    onUpdateShuConfig(newConfig);
    setIsConfigSaved(true);
    setTimeout(() => setIsConfigSaved(false), 3000);
  };

  const handleExportShuCsv = () => {
    const rows = hasilPerhitungan.map((h) => ({
      ID_Anggota: h.idAnggota,
      Nama_Anggota: h.namaAnggota,
      Total_Simpanan: h.totalSimpanan,
      Persen_Simpanan: `${h.persentaseSimpanan.toFixed(2)}%`,
      SHU_Jasa_Modal: h.shuJasaModal,
      Kontribusi_Bunga_Pinjaman: h.totalPinjamanDanBunga,
      Persen_Jasa_Usaha: `${h.persentaseUsaha.toFixed(2)}%`,
      SHU_Jasa_Usaha: h.shuJasaUsaha,
      TOTAL_SHU_DITERIMA: h.totalShuDiterima,
    }));
    exportToCsv(`Simulasi_SHU_Koperasi_${shuConfig.tahunBuku}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pendapatan Kotor
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{formatRupiah(totalPendapatanKotor)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Jasa pinjaman & operasional</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Beban Operasional
          </span>
          <h3 className="text-xl font-bold text-red-600 mt-1">{formatRupiah(totalBebanOperasional)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Biaya rapat, ATK, operasional</p>
        </div>

        <div className="bg-emerald-900 text-white rounded-2xl p-4.5 shadow-xs border border-emerald-800">
          <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
            Sisa Hasil Usaha (SHU) Kotor
          </span>
          <h3 className="text-xl font-bold text-emerald-400 mt-1">{formatRupiah(shuKotorTahunBerjalan)}</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">Siap dialokasikan ke anggota</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Bagian Anggota
          </span>
          <h3 className="text-xl font-bold text-purple-700 mt-1">
            {formatRupiah(danaJasaModal + danaJasaUsaha)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Jasa Modal ({persenModal}%) + Jasa Usaha ({persenUsaha}%)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Allocation Settings (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Alokasi SHU (AD/ART Koperasi)</h3>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {isConfigSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <p>Konfigurasi alokasi SHU berhasil diperbarui!</p>
                </div>
              )}

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Persentase pembagian SHU diatur berdasarkan keputusan Rapat Anggota Tahunan (RAT) dan Anggaran Dasar Koperasi.
              </p>

              {/* Jasa Modal Input */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Jasa Modal (Simpanan)</span>
                  <span className="text-emerald-700">{persenModal}% ({formatRupiah(danaJasaModal)})</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={persenModal}
                  onChange={(e) => setPersenModal(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Jasa Usaha Input */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Jasa Usaha (Pinjaman/Transaksi)</span>
                  <span className="text-blue-700">{persenUsaha}% ({formatRupiah(danaJasaUsaha)})</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={persenUsaha}
                  onChange={(e) => setPersenUsaha(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Dana Cadangan Input */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Dana Cadangan Koperasi</span>
                  <span className="text-slate-800">{persenCadangan}% ({formatRupiah(danaCadangan)})</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={persenCadangan}
                  onChange={(e) => setPersenCadangan(Number(e.target.value))}
                  className="w-full accent-slate-600"
                />
              </div>

              {/* Dana Pengurus & Sosial */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dana Pengurus (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={persenPengurus}
                    onChange={(e) => setPersenPengurus(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{formatRupiah(danaPengurus)}</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dana Sosial/Pendidikan (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={persenSosial}
                    onChange={(e) => setPersenSosial(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{formatRupiah(danaSosial)}</span>
                </div>
              </div>

              {/* Total Percentage Warning */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
                  totalPersen === 100
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span>Total Alokasi:</span>
                <span>{totalPersen}% {totalPersen !== 100 && '(Harus 100%)'}</span>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
              >
                Simpan Konfigurasi SHU
              </button>
            </div>
          </div>
        </div>

        {/* Right: Simulation Breakdown Table (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Simulasi Pembagian SHU per Anggota</h3>
              <p className="text-[11px] text-slate-500">
                Transparan berdasarkan proporsi simpanan modal & partisipasi usaha pinjaman
              </p>
            </div>

            <button
              onClick={handleExportShuCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors shadow-xs"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" /> Ekspor Hasil SHU
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Anggota</th>
                    <th className="py-3 px-3 text-right">Simpanan & Porsi</th>
                    <th className="py-3 px-3 text-right">SHU Modal</th>
                    <th className="py-3 px-3 text-right">Jasa Pinjaman</th>
                    <th className="py-3 px-3 text-right">SHU Usaha</th>
                    <th className="py-3 px-3 text-right">TOTAL SHU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {hasilPerhitungan.map((h) => (
                    <tr key={h.idAnggota} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{h.namaAnggota}</div>
                        <div className="font-mono text-[10px] text-slate-400">{h.idAnggota}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="text-slate-800">{formatRupiah(h.totalSimpanan)}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {h.persentaseSimpanan.toFixed(1)}% porsi
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-700">
                        {formatRupiah(h.shuJasaModal)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="text-slate-800">{formatRupiah(h.totalPinjamanDanBunga)}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {h.persentaseUsaha.toFixed(1)}% porsi
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-blue-700">
                        {formatRupiah(h.shuJasaUsaha)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 bg-emerald-50/30">
                        <span className="text-emerald-800 text-sm font-extrabold">{formatRupiah(h.totalShuDiterima)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td className="py-3 px-3 uppercase text-[11px]">Total Seluruh Anggota</td>
                    <td className="py-3 px-3 text-right">{formatRupiah(totalAllSavings)}</td>
                    <td className="py-3 px-3 text-right text-emerald-800">{formatRupiah(danaJasaModal)}</td>
                    <td className="py-3 px-3 text-right">{formatRupiah(totalAllLoanActivity)}</td>
                    <td className="py-3 px-3 text-right text-blue-800">{formatRupiah(danaJasaUsaha)}</td>
                    <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                      {formatRupiah(danaJasaModal + danaJasaUsaha)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
