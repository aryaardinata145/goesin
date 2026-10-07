import React from 'react';
import { Station } from '../data/campusData';
import { Navigation, Compass, LocateFixed, Bike } from 'lucide-react';

interface CampusMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  activeRideBikeId?: string | null;
  onCenterUser: () => void;
  userRecentered: boolean;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  activeRideBikeId,
  onCenterUser,
  userRecentered,
}) => {
  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] rounded-[16px] bg-[#F2EFE9] border border-[#E8E5DF] overflow-hidden shadow-warm-raised select-none">
      {/* Architectural Campus SVG Canvas */}
      <svg
        viewBox="0 0 800 520"
        className="w-full h-full object-cover"
        aria-label="Peta Stasiun Sepeda Kampus Goesin"
      >
        <defs>
          <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#E6E2DA"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Ground Base */}
        <rect width="800" height="520" fill="#F4F1EA" />
        <rect width="800" height="520" fill="url(#campusGrid)" />

        {/* Tropical Green Zones / Botanical Parks */}
        <path
          d="M 60 60 Q 190 40 280 110 T 420 95 Q 500 130 460 220 T 260 240 Q 110 220 60 60 Z"
          fill="#E5EFE8"
          opacity="0.85"
        />
        <path
          d="M 480 250 Q 640 220 730 310 T 680 460 Q 520 480 450 390 T 480 250 Z"
          fill="#E5EFE8"
          opacity="0.75"
        />
        <ellipse cx="210" cy="390" rx="125" ry="75" fill="#E8F0EA" />

        {/* Campus Wisdom Lake / Lembah Kampus */}
        <path
          d="M 540 70 Q 630 65 670 120 T 630 195 Q 560 190 535 140 T 540 70 Z"
          fill="#DCE6F2"
          stroke="#C6D4E6"
          strokeWidth="1.5"
        />

        {/* Campus Perimeter Boundary (Safe Geofence Line) */}
        <rect
          x="28"
          y="24"
          width="744"
          height="472"
          rx="28"
          fill="none"
          stroke="#1a2469"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity="0.28"
        />

        {/* Main Campus Ring Roads (Lingkar Kampus) */}
        <path
          d="M 120 480 L 180 330 L 210 140 L 365 100 L 580 215 L 620 390 L 445 400 L 180 330"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 210 140 L 370 198 L 580 215"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 370 198 L 445 400"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Dedicated Bike Lanes (Jalur Sepeda Kampus - Navy Dashed) */}
        <path
          d="M 208 135 L 368 198 L 576 218 L 448 385 L 176 332 Z"
          fill="none"
          stroke="#1a2469"
          strokeWidth="3"
          strokeDasharray="6 6"
          opacity="0.55"
        />

        {/* Architectural Building Footprints */}
        <g fill="#E6E2D8" stroke="#D5D0C5" strokeWidth="1.2">
          {/* Rectorate & Central Library */}
          <rect x="330" y="145" width="76" height="42" rx="6" />
          <rect x="345" y="218" width="52" height="32" rx="5" />
          {/* Engineering Complex */}
          <rect x="140" y="95" width="55" height="38" rx="6" />
          <rect x="230" y="105" width="48" height="34" rx="6" />
          {/* FEB Complex */}
          <rect x="595" y="175" width="66" height="44" rx="6" />
          <rect x="605" y="232" width="50" height="30" rx="5" />
          {/* Medical Complex */}
          <rect x="115" y="305" width="50" height="52" rx="6" />
          {/* Student Center / Gelanggang */}
          <rect x="465" y="365" width="72" height="42" rx="6" />
          {/* MIPA */}
          <rect x="295" y="55" width="60" height="32" rx="5" />
        </g>

        {/* Subtle Campus Zone Labels on Map */}
        <g className="font-label" fill="#63625D" fontSize="11" fontWeight="500" opacity="0.85">
          <text x="368" y="136" textAnchor="middle">GRAHA REKTORAT</text>
          <text x="168" y="86" textAnchor="middle">KLUSTER TEKNIK</text>
          <text x="628" y="166" textAnchor="middle">PLAZA FEB</text>
          <text x="140" y="295" textAnchor="middle">ZONA MEDIKA</text>
          <text x="502" y="425" textAnchor="middle">GELANGGANG GIK</text>
          <text x="605" y="135" textAnchor="middle" fill="#4f599f">LEMBAH KAMPUS</text>
        </g>

        {/* Active Route Highlight between User Location & Selected Station */}
        {selectedStation && (
          <line
            x1="395"
            y1="255"
            x2={(selectedStation.coordinates.x / 100) * 800}
            y2={(selectedStation.coordinates.y / 100) * 520}
            stroke="#1a2469"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {/* Current User Walking Position Pin */}
      <div
        style={{ left: '49.5%', top: '49%' }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center">
          <span
            className={`w-7 h-7 rounded-full bg-[#1a2469]/20 flex items-center justify-center transition-transform duration-200 ${
              userRecentered ? 'scale-125' : 'scale-100'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#1a2469] border-2 border-white shadow-sm" />
          </span>
        </div>
        <span className="mt-1 px-2 py-0.5 rounded bg-white/95 border border-[#E8E5DF] text-[11px] font-label font-medium text-[#1C1B19] shadow-warm-raised whitespace-nowrap">
          Posisi Anda · Perpustakaan
        </span>
      </div>

      {/* Interactive Station Marker Pins */}
      {stations.map((station) => {
        const isSelected = station.id === selectedStationId;
        const isEmpty = station.availableCount === 0;
        const isMaintenance = station.status === 'Perbaikan';

        let pinColorClasses = 'bg-[#FFFFFF] text-[#1C1B19] border-[#E8E5DF] hover:border-[#1a2469]';
        if (isSelected) {
          pinColorClasses = 'bg-[#1a2469] text-[#FFFFFF] border-[#1a2469] ring-4 ring-[#1a2469]/20';
        } else if (isMaintenance) {
          pinColorClasses = 'bg-[#FEE2E2] text-[#4f1c00] border-[#4f1c00]/30';
        } else if (isEmpty) {
          pinColorClasses = 'bg-[#F3F4F6] text-[#9CA3AF] border-[#E8E5DF]';
        }

        return (
          <button
            key={station.id}
            type="button"
            onClick={() => onSelectStation(station.id)}
            style={{
              left: `${station.coordinates.x}%`,
              top: `${station.coordinates.y}%`,
            }}
            aria-label={`Pilih ${station.name}, ${station.availableCount} sepeda tersedia`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full border shadow-warm-overlay flex items-center gap-1.5 transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2469] ${
              isSelected ? 'scale-105 z-30' : 'hover:scale-105'
            } ${pinColorClasses}`}
          >
            <Bike className="w-4 h-4 shrink-0" />
            <span className="font-label font-semibold text-[13px] tabular-nums whitespace-nowrap">
              {station.availableCount}
            </span>
            <span
              className={`hidden sm:inline text-[11px] font-label truncate max-w-[110px] ${
                isSelected ? 'text-white/90' : 'text-[#63625D]'
              }`}
            >
              {station.code}
            </span>
          </button>
        );
      })}

      {/* Top Left Map Context Bar */}
      <div className="absolute top-3 left-3 right-16 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-white/95 border border-[#E8E5DF] rounded-[12px] px-3.5 py-2 shadow-warm-overlay flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-[#1a2469] shrink-0" />
          <div className="text-[13px] leading-4">
            <span className="font-semibold text-[#1C1B19]">Jaringan Kampus Terpadu</span>
            <span className="mx-1.5 text-[#8F8E89]">·</span>
            <span className="text-[#63625D] tabular-nums">
              {stations.reduce((acc, s) => acc + s.availableCount, 0)} unit siap pakai
            </span>
          </div>
        </div>

        {activeRideBikeId && (
          <div className="bg-[#1a2469] text-white rounded-[12px] px-3.5 py-2 shadow-warm-overlay flex items-center gap-2 text-[13px] font-label font-medium">
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span>Sesi Aktif: Unit {activeRideBikeId}</span>
          </div>
        )}
      </div>

      {/* Top Right Recenter Floating Action Button (48x48px touch target) */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={onCenterUser}
          title="Pusatkan ke posisi saya"
          aria-label="Pusatkan peta ke posisi saya"
          className="w-12 h-12 rounded-full bg-white border border-[#E8E5DF] text-[#1C1B19] hover:border-[#1a2469] hover:text-[#1a2469] shadow-warm-overlay flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#1a2469]"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Map Selected Station Quick Preview Strip */}
      <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 border border-[#E8E5DF] rounded-[12px] p-3 shadow-warm-overlay flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-[#63625D] font-label">
            <span>{selectedStation.code}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{selectedStation.walkingDistance}</span>
          </div>
          <p className="text-[15px] font-semibold text-[#1C1B19] truncate">
            {selectedStation.name}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[13px] font-label">
          <span className="text-[#1a2469] font-semibold tabular-nums">
            {selectedStation.availableCount} Sepeda Tersedia
          </span>
          <span className="text-[#8F8E89]" aria-hidden="true">·</span>
          <span className="text-[#63625D] tabular-nums">
            {selectedStation.emptyDocks} Dock Kosong
          </span>
        </div>
      </div>
    </div>
  );
};
