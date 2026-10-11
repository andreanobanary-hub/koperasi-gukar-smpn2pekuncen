import React from 'react';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  HandCoins,
  BookOpen,
  Calculator,
  Download,
  RotateCcw,
  Building2,
  Wallet,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export type ActiveTab = 'dashboard' | 'anggota' | 'simpanan' | 'pinjaman' | 'pembukuan' | 'shu';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  totalKas: number;
  jumlahAnggota: number;
  onOpenExportModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  totalKas,
  jumlahAnggota,
  onOpenExportModal,
  onResetData,
}) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'anggota' as ActiveTab, label: 'Anggota', icon: Users, badge: jumlahAnggota },
    { id: 'simpanan' as ActiveTab, label: 'Simpanan', icon: PiggyBank },
    { id: 'pinjaman' as ActiveTab, label: 'Pinjaman & Angsuran', icon: HandCoins },
    { id: 'pembukuan' as ActiveTab, label: 'Pembukuan / Jurnal', icon: BookOpen },
    { id: 'shu' as ActiveTab, label: 'Hitung SHU', icon: Calculator },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <Building2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Koperasi Digital</h1>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Tahun Buku 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Sistem Pembukuan & Manajemen Keuangan KSP</p>
          </div>
        </div>

        {/* Quick summary and actions */}
        <div className="flex items-center gap-3">
          {/* Quick Kas badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Wallet size={16} className="text-emerald-600" />
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] leading-tight font-medium">SALDO KAS SAAT INI</span>
              <span className="font-bold text-slate-800">{formatRupiah(totalKas)}</span>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors border border-slate-200"
            title="Ekspor laporan ke Excel, CSV atau JSON"
          >
            <Download size={14} className="text-slate-600" />
            <span>Ekspor Data</span>
          </button>

          {/* Reset button */}
          <button
            onClick={() => {
              if (window.confirm('Kembalikan seluruh data ke contoh demo awal? Data tersimpan saat ini akan digantikan.')) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs rounded-xl transition-colors"
            title="Reset ke Data Demo Awal"
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-1 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
