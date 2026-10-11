import React, { useState, useEffect } from 'react';
import {
  Anggota,
  TransaksiSimpanan,
  Pinjaman,
  Angsuran,
  TransaksiKas,
  ShuConfig,
  HasilPerhitunganShu,
} from './types/koperasi';
import { storage } from './utils/storage';
import { generateNextId, getTodayDateString } from './utils/formatters';
import { Header, ActiveTab } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { AnggotaTab } from './components/AnggotaTab';
import { SimpananTab } from './components/SimpananTab';
import { PinjamanTab } from './components/PinjamanTab';
import { PembukuanTab } from './components/PembukuanTab';
import { ShuTab } from './components/ShuTab';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Core State backed by LocalStorage
  const [anggotaList, setAnggotaList] = useState<Anggota[]>(() => storage.getAnggota());
  const [simpananList, setSimpananList] = useState<TransaksiSimpanan[]>(() => storage.getSimpanan());
  const [pinjamanList, setPinjamanList] = useState<Pinjaman[]>(() => storage.getPinjaman());
  const [angsuranList, setAngsuranList] = useState<Angsuran[]>(() => storage.getAngsuran());
  const [kasList, setKasList] = useState<TransaksiKas[]>(() => storage.getKas());
  const [shuConfig, setShuConfig] = useState<ShuConfig>(() => storage.getShuConfig());

  // Save to LocalStorage on changes
  useEffect(() => {
    storage.saveAnggota(anggotaList);
  }, [anggotaList]);

  useEffect(() => {
    storage.saveSimpanan(simpananList);
  }, [simpananList]);

  useEffect(() => {
    storage.savePinjaman(pinjamanList);
  }, [pinjamanList]);

  useEffect(() => {
    storage.saveAngsuran(angsuranList);
  }, [angsuranList]);

  useEffect(() => {
    storage.saveKas(kasList);
  }, [kasList]);

  useEffect(() => {
    storage.saveShuConfig(shuConfig);
  }, [shuConfig]);

  // Overall Kas Calculation for Header
  const totalKasMasuk = kasList
    .filter((k) => k.kategoriKas === 'masuk')
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalKasKeluar = kasList
    .filter((k) => k.kategoriKas === 'keluar')
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalKas = totalKasMasuk - totalKasKeluar;

  // --- MEMBER ACTIONS ---
  const handleAddAnggota = (newAnggota: Anggota, simpananPokokNominal: number = 0) => {
    setAnggotaList((prev) => [...prev, newAnggota]);

    // If initial simpanan pokok is specified, record it in savings & cash ledger
    if (simpananPokokNominal > 0) {
      const simpId = generateNextId('SIMP', simpananList.map((s) => s.id));
      const simpTx: TransaksiSimpanan = {
        id: simpId,
        idAnggota: newAnggota.id,
        namaAnggota: newAnggota.nama,
        tanggal: newAnggota.tanggalBergabung || getTodayDateString(),
        jenis: 'pokok',
        tipe: 'setor',
        nominal: simpananPokokNominal,
        catatan: `Setoran Simpanan Pokok awal pendaftaran anggota ${newAnggota.nama}`,
      };
      setSimpananList((prev) => [...prev, simpTx]);

      const kasId = generateNextId('KAS', kasList.map((k) => k.id));
      const kasTx: TransaksiKas = {
        id: kasId,
        tanggal: newAnggota.tanggalBergabung || getTodayDateString(),
        noBukti: `BKM-${kasId.split('-')[1]}`,
        tipeTransaksi: 'simpanan_pokok',
        idAnggota: newAnggota.id,
        namaAnggota: newAnggota.nama,
        debitAkun: 'Kas/Bank',
        kreditAkun: 'Simpanan Pokok',
        nominal: simpananPokokNominal,
        kategoriKas: 'masuk',
        catatan: `Setoran Simpanan Pokok awal an. ${newAnggota.nama}`,
      };
      setKasList((prev) => [...prev, kasTx]);
    }
  };

  const handleUpdateAnggota = (updated: Anggota) => {
    setAnggotaList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteAnggota = (id: string) => {
    setAnggotaList((prev) => prev.filter((a) => a.id !== id));
  };

  // --- SAVINGS ACTIONS ---
  const handleAddSimpanan = (tx: TransaksiSimpanan, syncKas: boolean) => {
    setSimpananList((prev) => [...prev, tx]);

    if (syncKas) {
      const kasId = generateNextId('KAS', kasList.map((k) => k.id));
      const isSetor = tx.tipe === 'setor';
      const bukti = isSetor ? `BKM-${kasId.split('-')[1]}` : `BKK-${kasId.split('-')[1]}`;
      const tipeKas = `simpanan_${tx.jenis}` as any;

      const kasTx: TransaksiKas = {
        id: kasId,
        tanggal: tx.tanggal,
        noBukti: bukti,
        tipeTransaksi: tipeKas,
        idAnggota: tx.idAnggota,
        namaAnggota: tx.namaAnggota,
        debitAkun: isSetor ? 'Kas/Bank' : `Simpanan ${tx.jenis.toUpperCase()}`,
        kreditAkun: isSetor ? `Simpanan ${tx.jenis.toUpperCase()}` : 'Kas/Bank',
        nominal: tx.nominal,
        kategoriKas: isSetor ? 'masuk' : 'keluar',
        catatan: tx.catatan,
      };
      setKasList((prev) => [...prev, kasTx]);
    }
  };

  // --- LOAN ACTIONS ---
  const handleAddPinjaman = (newPinjaman: Pinjaman, syncKas: boolean) => {
    setPinjamanList((prev) => [...prev, newPinjaman]);

    if (syncKas) {
      const kasId = generateNextId('KAS', kasList.map((k) => k.id));
      const kasTx: TransaksiKas = {
        id: kasId,
        tanggal: newPinjaman.tanggalPengajuan,
        noBukti: `BKK-${kasId.split('-')[1]}`,
        tipeTransaksi: 'pencairan_pinjaman',
        idAnggota: newPinjaman.idAnggota,
        namaAnggota: newPinjaman.namaAnggota,
        debitAkun: 'Piutang Pinjaman Anggota',
        kreditAkun: 'Kas/Bank',
        nominal: newPinjaman.nominalPinjaman,
        kategoriKas: 'keluar',
        catatan: `Pencairan Pinjaman ${newPinjaman.id} an. ${newPinjaman.namaAnggota} (${newPinjaman.tujuan})`,
      };
      setKasList((prev) => [...prev, kasTx]);
    }
  };

  // --- INSTALLMENT ACTIONS ---
  const handlePayAngsuran = (newAngsuran: Angsuran, updatedPinjaman: Pinjaman) => {
    setAngsuranList((prev) => [...prev, newAngsuran]);
    setPinjamanList((prev) =>
      prev.map((p) => (p.id === updatedPinjaman.id ? updatedPinjaman : p))
    );

    // Auto-create Cash Ledger entry for installment
    const kasId = generateNextId('KAS', kasList.map((k) => k.id));
    const kasTx: TransaksiKas = {
      id: kasId,
      tanggal: newAngsuran.tanggalBayar,
      noBukti: `BKM-${kasId.split('-')[1]}`,
      tipeTransaksi: 'angsuran',
      idAnggota: newAngsuran.idAnggota,
      namaAnggota: newAngsuran.namaAnggota,
      debitAkun: 'Kas/Bank',
      kreditAkun: 'Piutang & Jasa Pinjaman',
      nominal: newAngsuran.totalDibayar,
      kategoriKas: 'masuk',
      catatan: `Angsuran ke-${newAngsuran.angsuranKe} ${newAngsuran.idPinjaman} an. ${newAngsuran.namaAnggota} (Pokok: Rp ${newAngsuran.pokokDibayar.toLocaleString('id-ID')}, Bunga: Rp ${newAngsuran.bungaDibayar.toLocaleString('id-ID')})`,
    };
    setKasList((prev) => [...prev, kasTx]);
  };

  // --- CASH LEDGER ACTIONS ---
  const handleAddTransaksiKas = (tx: TransaksiKas) => {
    setKasList((prev) => [...prev, tx]);
  };

  // --- RESET & RESTORE ---
  const handleResetData = () => {
    storage.resetAllData();
    setAnggotaList(storage.getAnggota());
    setSimpananList(storage.getSimpanan());
    setPinjamanList(storage.getPinjaman());
    setAngsuranList(storage.getAngsuran());
    setKasList(storage.getKas());
    setShuConfig(storage.getShuConfig());
  };

  const handleDataRestored = () => {
    setAnggotaList(storage.getAnggota());
    setSimpananList(storage.getSimpanan());
    setPinjamanList(storage.getPinjaman());
    setAngsuranList(storage.getAngsuran());
    setKasList(storage.getKas());
    setShuConfig(storage.getShuConfig());
  };

  // SHU List calculation for Excel export
  const totalBungaDiterima = angsuranList.reduce((sum, a) => sum + a.bungaDibayar, 0);
  const totalPendapatanLain = kasList
    .filter((k) => k.tipeTransaksi === 'operasional_pendapatan' && k.kreditAkun !== 'Modal Awal Koperasi')
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalBebanOperasional = kasList
    .filter((k) => k.tipeTransaksi === 'operasional_beban')
    .reduce((sum, k) => sum + k.nominal, 0);
  const shuKotorTahunBerjalan = Math.max(0, totalBungaDiterima + totalPendapatanLain - totalBebanOperasional);
  const danaJasaModal = Math.round((shuKotorTahunBerjalan * shuConfig.persentaseJasaModal) / 100);
  const danaJasaUsaha = Math.round((shuKotorTahunBerjalan * shuConfig.persentaseJasaUsaha) / 100);

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

  const memberLoanActivityMap: Record<string, number> = {};
  for (const a of anggotaList) {
    const bungaPaid = angsuranList
      .filter((ang) => ang.idAnggota === a.id)
      .reduce((sum, ang) => sum + ang.bungaDibayar, 0);
    memberLoanActivityMap[a.id] = bungaPaid;
  }
  const totalAllLoanActivity = Object.values(memberLoanActivityMap).reduce((sum, val) => sum + val, 0);

  const shuListForExport: HasilPerhitunganShu[] = anggotaList.map((a) => {
    const simpanan = memberSavingsMap[a.id] || 0;
    const porsiSimpanan = totalAllSavings > 0 ? (simpanan / totalAllSavings) * 100 : 0;
    const shuJasaModal = totalAllSavings > 0 ? Math.round((simpanan / totalAllSavings) * danaJasaModal) : 0;

    const volumeUsaha = memberLoanActivityMap[a.id] || 0;
    const porsiUsaha = totalAllLoanActivity > 0 ? (volumeUsaha / totalAllLoanActivity) * 100 : 0;
    const shuJasaUsaha =
      totalAllLoanActivity > 0 ? Math.round((volumeUsaha / totalAllLoanActivity) * danaJasaUsaha) : 0;

    return {
      idAnggota: a.id,
      namaAnggota: a.nama,
      totalSimpanan: simpanan,
      persentaseSimpanan: porsiSimpanan,
      shuJasaModal,
      totalPinjamanDanBunga: volumeUsaha,
      persentaseUsaha: porsiUsaha,
      shuJasaUsaha,
      totalShuDiterima: shuJasaModal + shuJasaUsaha,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header with Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalKas={totalKas}
        jumlahAnggota={anggotaList.length}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            anggotaList={anggotaList}
            simpananList={simpananList}
            pinjamanList={pinjamanList}
            angsuranList={angsuranList}
            kasList={kasList}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'anggota' && (
          <AnggotaTab
            anggotaList={anggotaList}
            simpananList={simpananList}
            pinjamanList={pinjamanList}
            angsuranList={angsuranList}
            onAddAnggota={handleAddAnggota}
            onUpdateAnggota={handleUpdateAnggota}
            onDeleteAnggota={handleDeleteAnggota}
          />
        )}

        {activeTab === 'simpanan' && (
          <SimpananTab
            anggotaList={anggotaList}
            simpananList={simpananList}
            onAddSimpanan={handleAddSimpanan}
          />
        )}

        {activeTab === 'pinjaman' && (
          <PinjamanTab
            anggotaList={anggotaList}
            pinjamanList={pinjamanList}
            angsuranList={angsuranList}
            onAddPinjaman={handleAddPinjaman}
            onPayAngsuran={handlePayAngsuran}
          />
        )}

        {activeTab === 'pembukuan' && (
          <PembukuanTab
            anggotaList={anggotaList}
            kasList={kasList}
            onAddTransaksiKas={handleAddTransaksiKas}
          />
        )}

        {activeTab === 'shu' && (
          <ShuTab
            anggotaList={anggotaList}
            simpananList={simpananList}
            pinjamanList={pinjamanList}
            angsuranList={angsuranList}
            kasList={kasList}
            shuConfig={shuConfig}
            onUpdateShuConfig={setShuConfig}
          />
        )}
      </main>

      {/* Export & Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        anggotaList={anggotaList}
        simpananList={simpananList}
        pinjamanList={pinjamanList}
        angsuranList={angsuranList}
        kasList={kasList}
        shuList={shuListForExport}
        onDataRestored={handleDataRestored}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Koperasi Digital Indonesia • Sistem Pembukuan Terintegrasi & PSAK Koperasi</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Penyimpanan Lokal: Aktif</span>
            <span>•</span>
            <span>Didukung Google Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
