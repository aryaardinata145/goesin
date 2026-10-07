/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bike,
  QrCode,
  Search,
  BatteryCharging,
  Footprints,
  Wrench,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  LogOut,
  Barcode,
  ShieldCheck,
} from 'lucide-react';
import {
  INITIAL_STATIONS,
  INITIAL_RIDE_HISTORY,
  INITIAL_REPORTS,
  STUDENT_PROFILE,
  Station,
  BikeUnit,
  RideHistoryItem,
  MaintenanceReport,
  UserAccount,
} from './data/campusData';
import { StatusBadge } from './components/StatusBadge';
import { CampusMap } from './components/CampusMap';
import { UnlockModal } from './components/UnlockModal';
import { ActiveRentalSheet } from './components/ActiveRentalSheet';
import { LoginScreen } from './components/LoginScreen';

type NavTab = 'jelajah' | 'stasiun' | 'riwayat' | 'lapor' | 'profil';
type StationFilter = 'Semua' | 'Tersedia' | 'Elektrik' | 'Perbaikan';

const ISSUE_OPTIONS = [
  'Rem Kurang Pakem',
  'Rantai / Pedal Kendor',
  'Ban Kempes',
  'Kunci Dock Macet',
  'Baterai Elektrik Lemah',
  'Sadel / Keranjang Rusak',
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('jelajah');
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState<string>(INITIAL_STATIONS[0].id);
  const [stationFilter, setStationFilter] = useState<StationFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active rental session state
  const [activeRide, setActiveRide] = useState<{
    bike: BikeUnit;
    originStation: Station;
    elapsedSeconds: number;
    scannedBarcode?: string;
  } | null>(null);

  // Unlock modal state
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [modalBike, setModalBike] = useState<BikeUnit | null>(null);

  // History & Maintenance state
  const [rideHistory, setRideHistory] = useState<RideHistoryItem[]>(INITIAL_RIDE_HISTORY);
  const [reports, setReports] = useState<MaintenanceReport[]>(INITIAL_REPORTS);
  const [freeQuotaMinutes, setFreeQuotaMinutes] = useState<number>(
    STUDENT_PROFILE.freeQuotaRemainingMinutes
  );

  // Report Form state
  const [reportBikeId, setReportBikeId] = useState<string>('GS-318');
  const [reportStationName, setReportStationName] = useState<string>(INITIAL_STATIONS[1].name);
  const [selectedIssues, setSelectedIssues] = useState<string[]>(['Rem Kurang Pakem']);
  const [reportSeverity, setReportSeverity] = useState<'Ringan' | 'Sedang' | 'Darurat'>('Sedang');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [toastBanner, setToastBanner] = useState<string | null>(null);
  const [userRecentered, setUserRecentered] = useState<boolean>(false);

  // Live timer for active ride
  useEffect(() => {
    if (!activeRide) return;
    const interval = setInterval(() => {
      setActiveRide((prev) =>
        prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : null
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRide]);

  // Clear temporary toast notification
  useEffect(() => {
    if (!toastBanner) return;
    const timer = setTimeout(() => setToastBanner(null), 4500);
    return () => clearTimeout(timer);
  }, [toastBanner]);

  const selectedStation =
    stations.find((s) => s.id === selectedStationId) || stations[0];

  // Filtered stations for directory & explorer
  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.facultyZone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (stationFilter === 'Tersedia') return station.availableCount > 0;
    if (stationFilter === 'Elektrik') {
      return station.bikes.some((b) => b.type === 'Elektrik' && b.status === 'Tersedia');
    }
    if (stationFilter === 'Perbaikan') {
      return (
        station.status === 'Perbaikan' ||
        station.bikes.some((b) => b.status === 'Perbaikan')
      );
    }
    return true;
  });

  const handleOpenUnlockModal = (bike?: BikeUnit, stationOverride?: Station) => {
    if (stationOverride) {
      setSelectedStationId(stationOverride.id);
    }
    setModalBike(bike || null);
    setIsUnlockModalOpen(true);
  };

  const handleConfirmUnlock = (
    bike: BikeUnit,
    station: Station,
    scannedBarcode?: string
  ) => {
    // Update station bike status to Sedang Digunakan
    setStations((prev) =>
      prev.map((st) => {
        if (st.id !== station.id) return st;
        const updatedBikes = st.bikes.map((b) =>
          b.id === bike.id ? { ...b, status: 'Sedang Digunakan' as const } : b
        );
        const newAvail = Math.max(0, st.availableCount - 1);
        return {
          ...st,
          availableCount: newAvail,
          emptyDocks: st.emptyDocks + 1,
          status: newAvail === 0 ? 'Habis' : st.status,
          bikes: updatedBikes,
        };
      })
    );

    setActiveRide({
      bike: { ...bike, status: 'Sedang Digunakan' },
      originStation: station,
      elapsedSeconds: 0,
      scannedBarcode,
    });
    setIsUnlockModalOpen(false);
    setToastBanner(
      scannedBarcode
        ? `Barcode [${scannedBarcode}] berhasil dipindai! Kunci Unit ${bike.id} terbuka.`
        : `Kunci terbuka! Unit ${bike.id} siap digunakan dari ${station.name}.`
    );
  };

  const handleFinishRide = (returnStationId: string) => {
    if (!activeRide) return;
    const targetStation =
      stations.find((s) => s.id === returnStationId) || activeRide.originStation;
    const durationMins = Math.max(1, Math.ceil(activeRide.elapsedSeconds / 60));

    // Return bike to station
    setStations((prev) =>
      prev.map((st) => {
        if (st.id !== targetStation.id) return st;
        const existsInStation = st.bikes.some((b) => b.id === activeRide.bike.id);
        const updatedBikes = existsInStation
          ? st.bikes.map((b) =>
              b.id === activeRide.bike.id
                ? { ...b, status: 'Tersedia' as const, lastChecked: 'Baru saja' }
                : b
            )
          : [
              {
                ...activeRide.bike,
                stationId: st.id,
                status: 'Tersedia' as const,
                lastChecked: 'Baru saja',
              },
              ...st.bikes,
            ];
        const newAvail = st.availableCount + 1;
        return {
          ...st,
          availableCount: newAvail,
          emptyDocks: Math.max(0, st.emptyDocks - 1),
          status: 'Tersedia',
          bikes: updatedBikes,
        };
      })
    );

    // Record ride history
    const newHistoryItem: RideHistoryItem = {
      id: `TR-${Math.floor(9850 + Math.random() * 140)}`,
      bikeId: activeRide.bike.id,
      bikeType: activeRide.bike.type,
      date: 'Hari ini, 07 Okt 2026',
      startTime: '08.00',
      endTime: `08.${String(durationMins).padStart(2, '0')}`,
      durationMinutes: durationMins,
      fromStation: activeRide.originStation.name,
      toStation: targetStation.name,
      distanceKm: Number((1.1 + durationMins * 0.12).toFixed(1)),
      quotaUsedMinutes: durationMins,
      extraFeeRp: 0,
      status: 'Tepat Waktu',
    };

    setRideHistory((prev) => [newHistoryItem, ...prev]);
    setFreeQuotaMinutes((prev) => Math.max(0, prev - durationMins));
    setActiveRide(null);
    setToastBanner(
      `Perjalanan selesai! Unit ${activeRide.bike.id} berhasil dikunci di ${targetStation.name}.`
    );
  };

  const handleToggleIssue = (issue: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIssues.length === 0) {
      setToastBanner('Pilih minimal satu jenis kendala komponen sepeda.');
      return;
    }

    const newReport: MaintenanceReport = {
      id: `LP-${Math.floor(410 + Math.random() * 90)}`,
      bikeId: reportBikeId.toUpperCase().startsWith('GS-')
        ? reportBikeId.toUpperCase()
        : `GS-${reportBikeId}`,
      stationName: reportStationName,
      issueCategories: selectedIssues,
      severity: reportSeverity,
      notes:
        reportNotes.trim() ||
        'Dilaporkan langsung melalui aplikasi Goesin oleh sivitas.',
      submittedAt: 'Baru saja · 07 Okt 2026',
      status: 'Menunggu Teknisi',
    };

    setReports((prev) => [newReport, ...prev]);
    setReportNotes('');
    setToastBanner(
      `Laporan kendala untuk unit ${newReport.bikeId} telah diterima tim teknisi kampus.`
    );
  };

  const handleJumpToReport = (bikeId: string, stationName: string) => {
    setReportBikeId(bikeId);
    setReportStationName(stationName);
    setActiveTab('lapor');
  };

  const handleCenterUser = () => {
    setSelectedStationId('st-perpustakaan');
    setUserRecentered(true);
    setTimeout(() => setUserRecentered(false), 600);
    setToastBanner('Peta dipusatkan ke lokasi Anda dekat Perpustakaan Pusat.');
  };

  const handleResolveReportAsAdmin = (reportId: string, bikeId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: 'Selesai Diperbaiki' } : r
      )
    );
    setStations((prev) =>
      prev.map((st) => {
        const hasBike = st.bikes.some((b) => b.id === bikeId);
        if (!hasBike) return st;
        const updatedBikes = st.bikes.map((b) =>
          b.id === bikeId
            ? { ...b, status: 'Tersedia' as const, gearCondition: 'Prima · Baru diservis teknisi' }
            : b
        );
        const availCount = updatedBikes.filter((b) => b.status === 'Tersedia').length;
        return {
          ...st,
          availableCount: availCount,
          status: availCount > 0 ? 'Tersedia' : st.status,
          bikes: updatedBikes,
        };
      })
    );
    setToastBanner(`Admin: Unit ${bikeId} selesai diperbaiki dan kembali berstatus Tersedia.`);
  };

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setToastBanner(
            `Selamat datang, ${user.name} (${
              user.role === 'admin' ? 'Mode Admin / Teknisi' : `NPM ${user.npmOrUsername}`
            }).`
          );
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1C1B19]">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF8F4]/95 backdrop-blur-sm border-b border-[#E8E5DF]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#peta"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('jelajah');
            }}
            className="text-[22px] font-bold tracking-[-0.01em] text-[#1a2469] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1a2469]"
          >
            Goesin
          </a>

          {/* Zone 2: 5 Clean text navigation links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-7 text-[15px] font-medium text-[#63625D]"
          >
            {(
              [
                { id: 'jelajah', label: 'Peta Kampus' },
                { id: 'stasiun', label: 'Daftar Stasiun' },
                { id: 'riwayat', label: 'Perjalanan' },
                { id: 'lapor', label: 'Lapor Kendala' },
                { id: 'profil', label: 'Kuota Sivitas' },
              ] as { id: NavTab; label: string }[]
            ).map((item) => {
              const isCurrent = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    isCurrent
                      ? 'text-[#1a2469] font-semibold border-[#1a2469]'
                      : 'border-transparent hover:text-[#1C1B19] hover:border-[#E8E5DF]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleOpenUnlockModal(
                  selectedStation.bikes.find((b) => b.status === 'Tersedia'),
                  selectedStation
                )
              }
              className="min-h-[44px] px-4 py-2 rounded-[14px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[14px] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Barcode className="w-4 h-4 shrink-0" />
              <span>Scan Barcode Sepeda</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentUser(null);
                setActiveRide(null);
              }}
              title="Keluar Akun"
              className="min-h-[44px] px-3 py-2 rounded-[14px] border border-[#E8E5DF] bg-white hover:bg-[#FAF8F4] text-[#1C1B19] font-label font-medium text-[13px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4 text-[#63625D] shrink-0" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile Segmented Navigation Bar (Visible on <768px) */}
        <div className="md:hidden border-t border-[#E8E5DF] bg-white px-4 py-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {(
              [
                { id: 'jelajah', label: 'Peta' },
                { id: 'stasiun', label: 'Stasiun' },
                { id: 'riwayat', label: 'Perjalanan' },
                { id: 'lapor', label: 'Lapor Kendala' },
                { id: 'profil', label: 'Kuota Sivitas' },
              ] as { id: NavTab; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-[10px] font-label text-[13px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#1a2469] text-white'
                    : 'text-[#63625D] hover:text-[#1C1B19]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Subtle Feedback Notification Banner */}
      {toastBanner && (
        <div className="max-w-[1120px] w-full mx-auto px-4 sm:px-8 pt-4">
          <div className="bg-white border border-[#1a2469]/30 rounded-[12px] px-4 py-3 shadow-warm-raised flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[14px] font-medium text-[#1C1B19]">
              <CheckCircle2 className="w-4 h-4 text-[#1a2469] shrink-0" />
              <span>{toastBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              className="text-[12px] font-label font-semibold text-[#63625D] hover:text-[#1C1B19] whitespace-nowrap"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container (Desktop 12-column max-w-1120px, Tablet 8-col, Mobile 4-col) */}
      <main
        className={`flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-8 ${
          activeRide ? 'pb-36' : 'pb-16'
        }`}
      >
        {/* TAB 1: JELAJAH PETA & INVENTARIS STASIUN */}
        {activeTab === 'jelajah' && (
          <>
            {/* Editorial Campus Header & Student Quota Summary */}
            <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E8E5DF]">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-label text-[#63625D]">
                  <span>Mobilitas Sivitas Akademika</span>
                  <span aria-hidden="true">·</span>
                  <span>Bulaksumur & Sekip</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">06.00 – 22.00 WIB</span>
                </div>
                <h1 className="text-[28px] leading-[36px] sm:text-[36px] sm:leading-[44px] font-bold text-[#1C1B19] tracking-[-0.01em] [text-wrap:balance]">
                  Transit tenang antar-fakultas, siap menemani jadwal kuliahmu.
                </h1>
              </div>

              {/* Unboxed Student Quota Summary Strip */}
              <div className="bg-white border border-[#E8E5DF] rounded-[16px] p-4 shadow-warm-raised flex items-center gap-5 shrink-0">
                <div>
                  <p className="text-[12px] font-label text-[#63625D]">
                    Sisa Kuota Gratis Hari Ini
                  </p>
                  <p className="text-[22px] leading-[28px] font-bold text-[#1a2469] tabular-nums mt-0.5">
                    {freeQuotaMinutes} Menit
                    <span className="text-[13px] font-normal text-[#63625D] ml-1.5">
                      / {STUDENT_PROFILE.dailyFreeQuotaMaxMinutes} mnt
                    </span>
                  </p>
                </div>
                <div className="h-9 w-[1px] bg-[#E8E5DF]" />
                <div>
                  <p className="text-[12px] font-label text-[#63625D]">
                    {currentUser.role === 'admin' ? 'Akses Pengelola' : 'Kartu Mahasiswa'}
                  </p>
                  <p className="text-[14px] font-semibold text-[#1C1B19] mt-0.5 tabular-nums">
                    {currentUser.npmOrUsername} · {currentUser.role === 'admin' ? 'Admin' : 'FT'}
                  </p>
                </div>
              </div>
            </section>

            {/* Split View: Interactive Campus Map (7 cols) + Active Station Inventory (5 cols) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Map & Station Filter Bar */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search & Segmented Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#8F8E89] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari stasiun fakultas, perpustakaan, atau kode ST..."
                      aria-label="Cari stasiun sepeda"
                      className="w-full h-12 pl-10 pr-4 rounded-[12px] bg-white border border-[#E8E5DF] text-[15px] text-[#1C1B19] placeholder:text-[#8F8E89] focus:outline-none focus:border-[#1a2469] focus:ring-2 focus:ring-[#1a2469]/15"
                    />
                  </div>
                  <div
                    role="group"
                    aria-label="Filter ketersediaan stasiun"
                    className="flex items-center gap-1 p-1 bg-white border border-[#E8E5DF] rounded-[12px] overflow-x-auto"
                  >
                    {(['Semua', 'Tersedia', 'Elektrik', 'Perbaikan'] as StationFilter[]).map(
                      (filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setStationFilter(filter)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-[8px] font-label text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                            stationFilter === filter
                              ? 'bg-[#1a2469] text-white'
                              : 'text-[#63625D] hover:text-[#1C1B19]'
                          }`}
                        >
                          {filter}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Interactive Campus Map */}
                <CampusMap
                  stations={filteredStations.length > 0 ? filteredStations : stations}
                  selectedStationId={selectedStation.id}
                  onSelectStation={(id) => setSelectedStationId(id)}
                  activeRideBikeId={activeRide?.bike.id || null}
                  onCenterUser={handleCenterUser}
                  userRecentered={userRecentered}
                />

                {/* Horizontal Station Selector Cards */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[18px] leading-[24px] font-semibold text-[#1C1B19]">
                      Stasiun Terdekat di Kampus ({filteredStations.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('stasiun')}
                      className="text-[14px] font-label font-semibold text-[#1a2469] hover:underline flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Lihat Semua Stasiun</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredStations.map((st) => {
                      const isSelected = st.id === selectedStation.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStationId(st.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedStationId(st.id);
                            }
                          }}
                          className={`p-4 rounded-[16px] bg-white border transition-all cursor-pointer shadow-warm-raised flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-[#1a2469] ring-2 ring-[#1a2469]/15'
                              : 'border-[#E8E5DF] hover:border-[#8F8E89]'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-label text-[#63625D]">
                                {st.code} · {st.facultyZone}
                              </span>
                              <StatusBadge
                                status={st.status}
                                customLabel={
                                  st.availableCount > 0
                                    ? `${st.availableCount} Tersedia`
                                    : st.status
                                }
                              />
                            </div>
                            <h3 className="text-[16px] font-semibold text-[#1C1B19] leading-snug">
                              {st.name}
                            </h3>
                          </div>

                          <div className="pt-2 border-t border-[#E8E5DF] flex items-center justify-between text-[13px] text-[#63625D]">
                            <span className="flex items-center gap-1.5 truncate">
                              <Footprints className="w-3.5 h-3.5 text-[#8F8E89] shrink-0" />
                              <span className="truncate">{st.walkingDistance}</span>
                            </span>
                            <span className="font-label tabular-nums shrink-0 ml-2">
                              {st.emptyDocks} dock kosong
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Station Detail & Bike Unit List (5 cols) */}
              <div className="lg:col-span-5 bg-white border border-[#E8E5DF] rounded-[16px] shadow-warm-raised overflow-hidden">
                {/* Station Documentary Image Header with Scrim */}
                <div className="relative h-44 bg-[#EAE7EE] overflow-hidden">
                  {selectedStation.imageUrl ? (
                    <img
                      src={selectedStation.imageUrl}
                      alt={selectedStation.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#63625D]">
                      <Bike className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                  <div className="absolute bottom-3.5 left-4 right-4 text-white">
                    <div className="flex items-center gap-2 text-[12px] font-label text-white/85">
                      <span>{selectedStation.code}</span>
                      <span>·</span>
                      <span>{selectedStation.operatingHours}</span>
                    </div>
                    <h2 className="text-[20px] leading-[26px] font-bold mt-0.5">
                      {selectedStation.name}
                    </h2>
                  </div>
                </div>

                {/* Station Telemetry & Address */}
                <div className="p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E8E5DF]">
                    <div className="space-y-0.5">
                      <p className="text-[13px] text-[#63625D]">{selectedStation.address}</p>
                      <p className="text-[13px] font-medium text-[#1a2469]">
                        {selectedStation.walkingDistance}
                      </p>
                    </div>
                    <StatusBadge
                      status={selectedStation.status}
                      customLabel={`${selectedStation.availableCount} Sepeda Tersedia`}
                    />
                  </div>

                  {/* Bike Inventory List inside Station */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold text-[#1C1B19]">
                        Daftar Unit Sepeda di Dock ({selectedStation.bikes.length})
                      </h3>
                      <span className="text-[12px] font-label text-[#63625D] tabular-nums">
                        Kapasitas {selectedStation.totalDocks} dock
                      </span>
                    </div>

                    <div className="divide-y divide-[#E8E5DF] border-t border-b border-[#E8E5DF]">
                      {selectedStation.bikes.map((bike) => {
                        const isAvailable = bike.status === 'Tersedia';
                        return (
                          <div
                            key={bike.id}
                            className="py-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[16px] text-[#1C1B19] tabular-nums">
                                  {bike.id}
                                </span>
                                <span className="text-[#8F8E89]">·</span>
                                <span className="text-[13px] font-medium text-[#63625D]">
                                  {bike.type}
                                </span>
                                {bike.batteryPercent !== undefined && (
                                  <>
                                    <span className="text-[#8F8E89]">·</span>
                                    <span className="inline-flex items-center gap-1 text-[13px] font-label font-semibold text-[#1a2469] tabular-nums">
                                      <BatteryCharging className="w-3.5 h-3.5" />
                                      {bike.batteryPercent}%
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="text-[13px] text-[#63625D] flex flex-wrap items-center gap-1.5">
                                <span>{bike.dockNumber}</span>
                                <span>·</span>
                                <span>{bike.gearCondition}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isAvailable ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenUnlockModal(bike, selectedStation)
                                  }
                                  className="min-h-[44px] px-3.5 py-2 rounded-[12px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[13px] transition-colors whitespace-nowrap"
                                >
                                  Pilih Unit
                                </button>
                              ) : (
                                <StatusBadge status={bike.status} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Action & Secondary Report Action */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      disabled={selectedStation.availableCount === 0}
                      onClick={() =>
                        handleOpenUnlockModal(
                          selectedStation.bikes.find((b) => b.status === 'Tersedia'),
                          selectedStation
                        )
                      }
                      className={`w-full min-h-[52px] px-5 py-3 rounded-[14px] font-label font-semibold text-[16px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                        selectedStation.availableCount > 0
                          ? 'bg-[#1a2469] hover:bg-[#000a55] text-white'
                          : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                      }`}
                    >
                      <QrCode className="w-5 h-5 shrink-0" />
                      <span>
                        {selectedStation.availableCount > 0
                          ? 'Buka Kunci Sepeda di Stasiun Ini'
                          : 'Unit Sedang Habis di Stasiun Ini'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleJumpToReport(
                          selectedStation.bikes[0]?.id || 'GS-104',
                          selectedStation.name
                        )
                      }
                      className="w-full min-h-[48px] px-4 py-2.5 rounded-[14px] border-[1.5px] border-[#E8E5DF] bg-white hover:bg-[#FAF8F4] text-[#1C1B19] font-label font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Wrench className="w-4 h-4 text-[#63625D] shrink-0" />
                      <span>Laporkan Masalah Stasiun / Sepeda</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: DIREKTORI STASIUN LENGKAP */}
        {activeTab === 'stasiun' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E5DF]">
              <div>
                <p className="text-[13px] font-label text-[#63625D]">
                  Direktori Stasiun & Kapasitas Dock
                </p>
                <h1 className="text-[28px] leading-[36px] font-bold text-[#1C1B19] mt-1">
                  Semua Titik Stasiun Kampus ({stations.length})
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#63625D]" />
                <span className="text-[13px] font-label text-[#63625D]">
                  Filter Status:
                </span>
                {(['Semua', 'Tersedia', 'Elektrik', 'Perbaikan'] as StationFilter[]).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStationFilter(f)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-[10px] font-label text-[13px] font-medium transition-colors whitespace-nowrap ${
                        stationFilter === f
                          ? 'bg-[#1a2469] text-white'
                          : 'bg-white border border-[#E8E5DF] text-[#63625D] hover:text-[#1C1B19]'
                      }`}
                    >
                      {f}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredStations.map((st) => (
                <div
                  key={st.id}
                  className="bg-white border border-[#E8E5DF] rounded-[16px] p-5 shadow-warm-raised flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-[12px] font-label text-[#63625D]">
                          <span>{st.code}</span>
                          <span>·</span>
                          <span>{st.facultyZone}</span>
                        </div>
                        <h2 className="text-[19px] font-semibold text-[#1C1B19] mt-0.5">
                          {st.name}
                        </h2>
                      </div>
                      <StatusBadge
                        status={st.status}
                        customLabel={`${st.availableCount} Sepeda Tersedia`}
                      />
                    </div>

                    <p className="text-[14px] text-[#63625D]">{st.address}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#63625D] pt-1">
                      <span className="flex items-center gap-1.5 text-[#1C1B19] font-medium">
                        <Footprints className="w-4 h-4 text-[#1a2469]" />
                        {st.walkingDistance}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {st.emptyDocks} dari {st.totalDocks} dock kosong
                      </span>
                      <span>·</span>
                      <span className="tabular-nums">{st.operatingHours}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8E5DF] flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStationId(st.id);
                        setActiveTab('jelajah');
                      }}
                      className="min-h-[44px] px-3.5 py-2 rounded-[12px] text-[#1a2469] font-label font-semibold text-[14px] hover:bg-[#FAF8F4] transition-colors whitespace-nowrap"
                    >
                      Lihat di Peta
                    </button>
                    <button
                      type="button"
                      disabled={st.availableCount === 0}
                      onClick={() =>
                        handleOpenUnlockModal(
                          st.bikes.find((b) => b.status === 'Tersedia'),
                          st
                        )
                      }
                      className={`min-h-[44px] px-4 py-2 rounded-[12px] font-label font-semibold text-[14px] transition-colors whitespace-nowrap ${
                        st.availableCount > 0
                          ? 'bg-[#1a2469] hover:bg-[#000a55] text-white'
                          : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                      }`}
                    >
                      {st.availableCount > 0 ? 'Pinjam dari Stasiun Ini' : 'Stok Habis'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: RIWAYAT PERJALANAN & LOG TRANSIT */}
        {activeTab === 'riwayat' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E5DF]">
              <div>
                <p className="text-[13px] font-label text-[#63625D]">
                  Catatan Mobilitas Semester Gasal
                </p>
                <h1 className="text-[28px] leading-[36px] font-bold text-[#1C1B19] mt-1">
                  Riwayat Perjalanan Kampus
                </h1>
              </div>
              <div className="flex items-center gap-6 text-[14px] text-[#63625D]">
                <div>
                  <span className="block text-[12px] font-label">Total Perjalanan</span>
                  <span className="font-bold text-[18px] text-[#1C1B19] tabular-nums">
                    {STUDENT_PROFILE.totalRidesSemester +
                      (rideHistory.length - INITIAL_RIDE_HISTORY.length)}{' '}
                    Sesi
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-[#E8E5DF]" />
                <div>
                  <span className="block text-[12px] font-label">Jarak Tempuh</span>
                  <span className="font-bold text-[18px] text-[#1a2469] tabular-nums">
                    {STUDENT_PROFILE.totalDistanceKm} km
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E8E5DF] rounded-[16px] shadow-warm-raised divide-y divide-[#E8E5DF]">
              {rideHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-[13px] font-label text-[#63625D]">
                      <span className="font-semibold text-[#1a2469] tabular-nums">
                        Unit {item.bikeId} ({item.bikeType})
                      </span>
                      <span>·</span>
                      <span>{item.date}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {item.startTime} – {item.endTime} WIB
                      </span>
                    </div>
                    <p className="text-[16px] font-semibold text-[#1C1B19]">
                      {item.fromStation} <span className="text-[#8F8E89] mx-1">→</span>{' '}
                      {item.toStation}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#63625D] tabular-nums">
                      <span>Durasi {item.durationMinutes} menit</span>
                      <span>·</span>
                      <span>Jarak {item.distanceKm} km</span>
                      <span>·</span>
                      <span>Kuota terpakai {item.quotaUsedMinutes} menit</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                    <span className="text-[15px] font-semibold text-[#1C1B19] tabular-nums">
                      {item.extraFeeRp === 0
                        ? 'Rp 0 (Kuota Sivitas)'
                        : `Rp ${item.extraFeeRp.toLocaleString('id-ID')}`}
                    </span>
                    <StatusBadge status="Tersedia" customLabel={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 4: LAPORKAN MASALAH / KENDALA SEPEDA */}
        {activeTab === 'lapor' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white border border-[#E8E5DF] rounded-[16px] p-6 shadow-warm-raised space-y-6">
              <div className="border-b border-[#E8E5DF] pb-4">
                <p className="text-[13px] font-label text-[#63625D]">
                  Pemeliharaan Bersama Komunitas Kampus
                </p>
                <h1 className="text-[24px] leading-[32px] font-bold text-[#1C1B19] mt-1">
                  Laporkan Kendala Sepeda atau Dock
                </h1>
                <p className="text-[14px] text-[#63625D] mt-1">
                  Bantu rekan mahasiswa berikutnya berkendara dengan aman. Teknisi kampus akan segera mengunci unit untuk perbaikan.
                </p>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="report-bike-id"
                      className="block font-label text-[14px] font-medium text-[#1C1B19] mb-1.5"
                    >
                      Nomor Unit Sepeda
                    </label>
                    <input
                      id="report-bike-id"
                      type="text"
                      value={reportBikeId}
                      onChange={(e) => setReportBikeId(e.target.value)}
                      placeholder="Contoh: GS-318"
                      className="w-full h-12 px-4 rounded-[12px] bg-white border border-[#E8E5DF] text-[15px] font-semibold text-[#1C1B19] tabular-nums focus:outline-none focus:border-[#1a2469]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="report-station"
                      className="block font-label text-[14px] font-medium text-[#1C1B19] mb-1.5"
                    >
                      Lokasi Stasiun Saat Ini
                    </label>
                    <select
                      id="report-station"
                      value={reportStationName}
                      onChange={(e) => setReportStationName(e.target.value)}
                      className="w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E8E5DF] text-[15px] text-[#1C1B19] focus:outline-none focus:border-[#1a2469]"
                    >
                      {stations.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checkboxes with 48px touch target zone */}
                <div className="space-y-2">
                  <span className="block font-label text-[14px] font-medium text-[#1C1B19]">
                    Komponen yang Mengalami Kendala
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ISSUE_OPTIONS.map((issue) => {
                      const isChecked = selectedIssues.includes(issue);
                      return (
                        <label
                          key={issue}
                          className={`min-h-[48px] px-3.5 py-2.5 rounded-[12px] border flex items-center gap-3 cursor-pointer select-none transition-colors ${
                            isChecked
                              ? 'border-[#1a2469] bg-[#FAF8F4]'
                              : 'border-[#E8E5DF] bg-white hover:bg-[#FAF8F4]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleIssue(issue)}
                            className="w-5 h-5 rounded-[4px] accent-[#1a2469] cursor-pointer shrink-0"
                          />
                          <span className="text-[14px] font-medium text-[#1C1B19]">
                            {issue}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Radio Buttons for Severity (48px touch zone) */}
                <div className="space-y-2">
                  <span className="block font-label text-[14px] font-medium text-[#1C1B19]">
                    Tingkat Urgensi Kerusakan
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Ringan', 'Sedang', 'Darurat'] as const).map((level) => (
                      <label
                        key={level}
                        className={`min-h-[48px] px-3 py-2 rounded-[12px] border flex items-center justify-center gap-2 cursor-pointer select-none transition-colors ${
                          reportSeverity === level
                            ? 'border-[#1a2469] bg-[#FAF8F4] font-semibold'
                            : 'border-[#E8E5DF] bg-white hover:bg-[#FAF8F4]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="severity"
                          checked={reportSeverity === level}
                          onChange={() => setReportSeverity(level)}
                          className="w-4 h-4 accent-[#1a2469] cursor-pointer"
                        />
                        <span className="text-[14px] text-[#1C1B19]">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="report-notes"
                    className="block font-label text-[14px] font-medium text-[#1C1B19] mb-1.5"
                  >
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    id="report-notes"
                    rows={3}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Contoh: Rantai agak berbunyi saat menanjak di dekat Gedung Dekanat..."
                    className="w-full p-3.5 rounded-[12px] bg-white border border-[#E8E5DF] text-[15px] text-[#1C1B19] placeholder:text-[#8F8E89] focus:outline-none focus:border-[#1a2469]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[52px] px-5 py-3 rounded-[14px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[16px] transition-colors whitespace-nowrap"
                >
                  Kirim Laporan ke Teknisi Kampus
                </button>
              </form>
            </div>

            {/* Right: Active Maintenance Status Feed */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-[#E8E5DF] rounded-[16px] p-5 shadow-warm-raised space-y-4">
                <h2 className="text-[18px] font-semibold text-[#1C1B19]">
                  Status Laporan Terkini ({reports.length})
                </h2>
                <div className="divide-y divide-[#E8E5DF]">
                  {reports.map((rep) => (
                    <div key={rep.id} className="py-3.5 space-y-2 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[15px] text-[#1C1B19] tabular-nums">
                          Unit {rep.bikeId} · {rep.id}
                        </span>
                        <StatusBadge status="Perbaikan" customLabel={rep.status} />
                      </div>
                      <p className="text-[13px] font-medium text-[#63625D]">
                        {rep.stationName}
                      </p>
                      <p className="text-[13px] text-[#1C1B19]">
                        Kendala: {rep.issueCategories.join(' · ')}
                      </p>
                      <p className="text-[13px] text-[#63625D] italic">"{rep.notes}"</p>
                      <p className="text-[12px] font-label text-[#8F8E89]">
                        {rep.submittedAt} · Urgensi {rep.severity}
                      </p>
                      {currentUser.role === 'admin' && rep.status !== 'Selesai Diperbaiki' && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleResolveReportAsAdmin(rep.id, rep.bikeId)}
                            className="min-h-[38px] px-3 py-1.5 rounded-[10px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[12px] flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tandai Selesai Diperbaiki (Admin)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: PROFIL & KUOTA SIVITAS AKADEMIKA */}
        {activeTab === 'profil' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white border border-[#E8E5DF] rounded-[16px] p-6 shadow-warm-raised space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={STUDENT_PROFILE.avatar}
                  alt={STUDENT_PROFILE.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border border-[#E8E5DF] shrink-0"
                />
                <div>
                  <h1 className="text-[20px] font-bold text-[#1C1B19]">
                    {currentUser.name}
                  </h1>
                  <p className="text-[13px] font-label text-[#63625D] tabular-nums">
                    {currentUser.role === 'admin'
                      ? `Username: ${currentUser.npmOrUsername}`
                      : `NPM: ${currentUser.npmOrUsername}`}
                  </p>
                  <p className="text-[13px] text-[#1a2469] font-medium mt-0.5">
                    {currentUser.faculty}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E5DF] space-y-3 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#63625D]">Status Kartu Kampus</span>
                  <span className="font-semibold text-[#1C1B19]">
                    {STUDENT_PROFILE.campusPassStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#63625D]">Sisa Kuota Harian</span>
                  <span className="font-semibold text-[#1a2469] tabular-nums">
                    {freeQuotaMinutes} dari {STUDENT_PROFILE.dailyFreeQuotaMaxMinutes} Menit
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#63625D]">Saldo Deposit Kelebihan Durasi</span>
                  <span className="font-semibold text-[#1C1B19] tabular-nums">
                    Rp {STUDENT_PROFILE.walletBalanceRp.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#E8E5DF] rounded-[16px] p-6 shadow-warm-raised space-y-5">
              <h2 className="text-[20px] font-bold text-[#1C1B19]">
                Panduan Penggunaan Sepeda Kampus Goesin
              </h2>
              <div className="divide-y divide-[#E8E5DF] text-[15px]">
                <div className="py-3.5 space-y-1 first:pt-0">
                  <h3 className="font-semibold text-[#1C1B19]">
                    01. Kuota Gratis 60 Menit Setiap Hari Kuliah
                  </h3>
                  <p className="text-[14px] text-[#63625D]">
                    Setiap mahasiswa, dosen, dan tenaga kependidikan dengan SSO kampus aktif mendapatkan kuota gratis 60 menit per hari untuk transit antar-fakultas.
                  </p>
                </div>
                <div className="py-3.5 space-y-1">
                  <h3 className="font-semibold text-[#1C1B19]">
                    02. Pengembalian Wajib di Stasiun Resmi
                  </h3>
                  <p className="text-[14px] text-[#63625D]">
                    Pastikan roda depan masuk ke dalam slot dock stasiun hingga lampu indikator berubah hijau dan terdengar bunyi klik penguncian.
                  </p>
                </div>
                <div className="py-3.5 space-y-1 last:pb-0">
                  <h3 className="font-semibold text-[#1C1B19]">
                    03. Batas Kecepatan & Zona Pejalan Kaki
                  </h3>
                  <p className="text-[14px] text-[#63625D]">
                    Utamakan pejalan kaki di penyeberangan zebra kampus. Kecepatan bantuan elektrik dibatasi hingga 18 km/jam di dalam lingkar kampus.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Quiet Campus Footer */}
      <footer className="border-t border-[#E8E5DF] bg-[#FAF8F4] py-6 px-4 sm:px-8 mt-auto">
        <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#63625D]">
          <p>
            Goesin Campus Mobility · Unit Layanan Transportasi Hijau Universitas
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('lapor')}
              className="hover:text-[#1C1B19] transition-colors"
            >
              Bantuan Teknisi
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveTab('profil')}
              className="hover:text-[#1C1B19] transition-colors"
            >
              Ketentuan Sivitas
            </button>
          </div>
        </div>
      </footer>

      {/* Unlock Bike Modal (QR Scan & Manual PIN) */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        selectedBike={modalBike}
        selectedStation={selectedStation}
        allStations={stations}
        onConfirmUnlock={handleConfirmUnlock}
      />

      {/* Persistent Active Rental Bottom Sheet (Goesin Bottom Sheet) */}
      {activeRide && (
        <ActiveRentalSheet
          activeBike={activeRide.bike}
          originStation={activeRide.originStation}
          elapsedSeconds={activeRide.elapsedSeconds}
          freeQuotaRemainingMinutes={freeQuotaMinutes}
          stations={stations}
          onFinishRide={handleFinishRide}
          onReportIssueClick={handleJumpToReport}
        />
      )}
    </div>
  );
}

