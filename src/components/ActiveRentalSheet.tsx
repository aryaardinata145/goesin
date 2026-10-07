import React, { useState } from 'react';
import { Lock, AlertCircle, Timer, Navigation, CheckCircle2 } from 'lucide-react';
import { BikeUnit, Station } from '../data/campusData';

interface ActiveRentalSheetProps {
  activeBike: BikeUnit;
  originStation: Station;
  elapsedSeconds: number;
  freeQuotaRemainingMinutes: number;
  stations: Station[];
  onFinishRide: (returnStationId: string) => void;
  onReportIssueClick: (bikeId: string, stationName: string) => void;
}

export const ActiveRentalSheet: React.FC<ActiveRentalSheetProps> = ({
  activeBike,
  originStation,
  elapsedSeconds,
  freeQuotaRemainingMinutes,
  stations,
  onFinishRide,
  onReportIssueClick,
}) => {
  const [returnStationId, setReturnStationId] = useState<string>(originStation.id);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const dynamicQuotaLeft = Math.max(0, freeQuotaRemainingMinutes - minutes);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E5DF] shadow-warm-overlay"
      role="region"
      aria-label="Panel perjalanan sepeda aktif"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-8 py-3.5">
        {showReturnPicker ? (
          <div className="space-y-3 pb-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[15px] text-[#1C1B19]">
                Pilih Stasiun Pengembalian Dock
              </p>
              <button
                type="button"
                onClick={() => setShowReturnPicker(false)}
                className="text-[13px] font-label font-medium text-[#1a2469] hover:underline"
              >
                Kembali
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {stations.slice(0, 3).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setReturnStationId(st.id)}
                  className={`min-h-[48px] p-3 rounded-[12px] border text-left transition-colors flex items-center justify-between ${
                    returnStationId === st.id
                      ? 'border-[#1a2469] bg-[#FAF8F4]'
                      : 'border-[#E8E5DF] bg-white hover:bg-[#FAF8F4]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[14px] font-semibold text-[#1C1B19] truncate">{st.name}</p>
                    <p className="text-[12px] text-[#63625D] tabular-nums">
                      {st.emptyDocks} dock kosong tersedia
                    </p>
                  </div>
                  {returnStationId === st.id && (
                    <CheckCircle2 className="w-4 h-4 text-[#1a2469] shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowReturnPicker(false);
                  onFinishRide(returnStationId);
                }}
                className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-[14px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Konfirmasi Kunci Dock & Selesai</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left: Active Session Status & Timer */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[12px] bg-[#FEF3C7] text-[#727594] flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[16px] text-[#1C1B19] tabular-nums">
                    Unit {activeBike.id} ({activeBike.type})
                  </span>
                  <span className="text-[#8F8E89]">·</span>
                  <span className="font-label font-semibold text-[16px] text-[#1a2469] tabular-nums">
                    {formattedTime}
                  </span>
                  <span className="text-[#8F8E89]">·</span>
                  <span className="text-[13px] font-label text-[#63625D] tabular-nums">
                    Sisa Kuota Gratis: {dynamicQuotaLeft} Menit
                  </span>
                </div>
                <p className="text-[13px] text-[#63625D] flex items-center gap-1.5 mt-0.5">
                  <Navigation className="w-3.5 h-3.5 text-[#1a2469] shrink-0" />
                  <span>Berangkat dari {originStation.name}</span>
                </p>
              </div>
            </div>

            {/* Right: Secondary & Primary Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onReportIssueClick(activeBike.id, originStation.name)}
                className="min-h-[48px] px-4 py-2 rounded-[14px] border-[1.5px] border-[#E8E5DF] bg-white hover:bg-[#FAF8F4] text-[#1C1B19] font-label font-medium text-[14px] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <AlertCircle className="w-4 h-4 text-[#4f1c00] shrink-0" />
                <span>Laporkan Masalah</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReturnPicker(true)}
                className="flex-1 sm:flex-initial min-h-[48px] px-5 py-2.5 rounded-[14px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Kunci & Selesai</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
