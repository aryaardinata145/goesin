import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  KeyRound,
  X,
  CheckCircle2,
  Bike,
  BatteryCharging,
  ShieldCheck,
  Camera,
  RefreshCw,
  Barcode,
  Sparkles,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BikeUnit, Station } from '../data/campusData';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBike: BikeUnit | null;
  selectedStation: Station;
  allStations: Station[];
  onConfirmUnlock: (bike: BikeUnit, station: Station, scannedBarcode?: string) => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  onClose,
  selectedBike,
  selectedStation,
  allStations,
  onConfirmUnlock,
}) => {
  const [entryMode, setEntryMode] = useState<'qr' | 'pin'>('qr');
  const [manualCode, setManualCode] = useState(
    selectedBike ? selectedBike.id.replace('GS-', '') : '104'
  );
  const [safetyChecked, setSafetyChecked] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Camera Barcode Scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedBarcodeValue, setScannedBarcodeValue] = useState<string | null>(null);
  const [scannedFormatName, setScannedFormatName] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Sync default bike code when modal opens
  useEffect(() => {
    if (isOpen) {
      setManualCode(selectedBike ? selectedBike.id.replace('GS-', '') : '104');
      setScannedBarcodeValue(null);
      setScannedFormatName(null);
      setErrorMessage(null);
    }
  }, [isOpen, selectedBike]);

  // Start / Stop real camera scanner using @zxing/browser + native BarcodeDetector fallback
  useEffect(() => {
    if (!isOpen || entryMode !== 'qr') {
      return;
    }

    let isMounted = true;
    let mediaStream: MediaStream | null = null;
    let zxingControls: { stop: () => void } | null = null;
    let nativeDetectorTimer: number | null = null;

    const startCameraScanner = async () => {
      setCameraStatus('starting');
      setCameraError(null);

      try {
        // Request camera stream so user can scan any supermarket barcode / QR code
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        const videoEl = videoRef.current;
        if (!videoEl) return;

        videoEl.srcObject = mediaStream;
        await videoEl.play();
        setCameraStatus('scanning');

        // 1. If browser supports native BarcodeDetector API (Chrome/Edge/Android), run fast parallel loop
        const WindowWithDetector = window as unknown as {
          BarcodeDetector?: new (options?: { formats: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string; format: string }>>;
          };
        };

        if (WindowWithDetector.BarcodeDetector) {
          try {
            const detector = new WindowWithDetector.BarcodeDetector({
              formats: [
                'ean_13',
                'ean_8',
                'upc_a',
                'upc_e',
                'code_128',
                'code_39',
                'code_93',
                'itf',
                'codabar',
                'qr_code',
                'data_matrix',
              ],
            });

            const scanNativeFrame = async () => {
              if (!isMounted || !videoRef.current) return;
              try {
                if (videoRef.current.readyState >= 2) {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0 && isMounted) {
                    const hit = barcodes[0];
                    setScannedBarcodeValue(hit.rawValue);
                    setScannedFormatName(hit.format.toUpperCase());
                    return;
                  }
                }
              } catch {
                // ignore frame error
              }
              if (isMounted) {
                nativeDetectorTimer = window.setTimeout(scanNativeFrame, 200);
              }
            };
            scanNativeFrame();
          } catch {
            // fallback to ZXing below
          }
        }

        // 2. Also run ZXing BrowserMultiFormatReader on the same video element for universal 1D/2D support
        const codeReader = new BrowserMultiFormatReader();
        zxingControls = await codeReader.decodeFromVideoElement(
          videoEl,
          (result) => {
            if (result && isMounted) {
              const text = result.getText();
              const format = String(result.getBarcodeFormat());
              setScannedBarcodeValue(text);
              setScannedFormatName(format);
            }
          }
        );
      } catch (err) {
        if (!isMounted) return;
        setCameraStatus('error');
        setCameraError(
          'Kamera tidak dapat diakses (izin ditolak atau perangkat tidak memiliki kamera). Anda dapat menekan tombol "Simulasi Scan Barcode Produk" di bawah atau menggunakan Kode Nomor Unit.'
        );
      }
    };

    startCameraScanner();

    return () => {
      isMounted = false;
      if (nativeDetectorTimer) {
        clearTimeout(nativeDetectorTimer);
      }
      if (zxingControls) {
        try {
          zxingControls.stop();
        } catch {
          // ignore cleanup
        }
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, entryMode, facingMode]);

  if (!isOpen) return null;

  // Map any scanned barcode or manual code to an available bike unit
  const resolveTargetBike = (): { bike: BikeUnit; station: Station } | null => {
    // If user scanned any barcode (e.g. supermarket product 899xxxx) or is in QR mode, pick selectedBike or first available bike
    if (entryMode === 'qr') {
      if (selectedBike && selectedBike.status === 'Tersedia') {
        return { bike: selectedBike, station: selectedStation };
      }
      const firstAvailInStation = selectedStation.bikes.find((b) => b.status === 'Tersedia');
      if (firstAvailInStation) {
        return { bike: firstAvailInStation, station: selectedStation };
      }
      for (const st of allStations) {
        const anyAvail = st.bikes.find((b) => b.status === 'Tersedia');
        if (anyAvail) return { bike: anyAvail, station: st };
      }
    }

    const normalizedCode = manualCode.trim().toUpperCase().replace('GS-', '');
    const fullId = `GS-${normalizedCode}`;

    for (const st of allStations) {
      const found = st.bikes.find((b) => b.id === fullId);
      if (found) {
        return { bike: found, station: st };
      }
    }
    return null;
  };

  const handleStartRide = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!safetyChecked) {
      setErrorMessage('Mohon centang konfirmasi pemeriksaan rem dan tekanan ban sebelum berangkat.');
      return;
    }

    const resolved = resolveTargetBike();
    if (!resolved) {
      setErrorMessage('Kode unit sepeda tidak ditemukan. Coba masukkan kode 104, 108, 219, atau 302.');
      return;
    }

    if (resolved.bike.status !== 'Tersedia') {
      setErrorMessage(
        `Unit ${resolved.bike.id} saat ini berstatus "${resolved.bike.status}" dan tidak dapat dibuka.`
      );
      return;
    }

    onConfirmUnlock(resolved.bike, resolved.station, scannedBarcodeValue || undefined);
  };

  const handleSimulateProductBarcode = () => {
    const sampleSupermarketBarcodes = [
      { code: '8992761134012', label: 'EAN-13 · Produk Minuman Kemasan' },
      { code: '8999999045128', label: 'EAN-13 · Produk Camilan Supermarket' },
      { code: '8991002105423', label: 'EAN-13 · Kopi Botol Kampus' },
    ];
    const pick =
      sampleSupermarketBarcodes[Math.floor(Math.random() * sampleSupermarketBarcodes.length)];
    setScannedBarcodeValue(pick.code);
    setScannedFormatName(pick.label);
  };

  const targetPreview = resolveTargetBike();
  const activePreviewBike = targetPreview?.bike || selectedBike || selectedStation.bikes[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1B19]/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
    >
      <div className="w-full sm:max-w-[500px] bg-white border border-[#E8E5DF] rounded-t-[20px] sm:rounded-[16px] shadow-warm-overlay overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="pt-3 px-5 pb-3 border-b border-[#E8E5DF] flex items-center justify-between">
          <div>
            <p className="text-[12px] font-label text-[#63625D]">
              {selectedStation.name}
            </p>
            <h2 id="unlock-modal-title" className="text-[18px] font-semibold text-[#1C1B19]">
              Pindai Barcode / Buka Kunci Sepeda
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela buka kunci"
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#63625D] hover:bg-[#FAF8F4] hover:text-[#1C1B19] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF8F4] border border-[#E8E5DF] rounded-[12px]">
            <button
              type="button"
              onClick={() => {
                setEntryMode('qr');
                setErrorMessage(null);
              }}
              className={`min-h-[44px] px-3 py-2 rounded-[10px] font-label text-[14px] font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                entryMode === 'qr'
                  ? 'bg-[#1a2469] text-white'
                  : 'text-[#63625D] hover:text-[#1C1B19]'
              }`}
            >
              <Barcode className="w-4 h-4 shrink-0" />
              <span>Kamera Scan Barcode</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryMode('pin');
                setErrorMessage(null);
              }}
              className={`min-h-[44px] px-3 py-2 rounded-[10px] font-label text-[14px] font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                entryMode === 'pin'
                  ? 'bg-[#1a2469] text-white'
                  : 'text-[#63625D] hover:text-[#1C1B19]'
              }`}
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Kode Nomor Unit</span>
            </button>
          </div>

          <form onSubmit={handleStartRide} className="space-y-4">
            {entryMode === 'qr' ? (
              <div className="rounded-[16px] bg-[#FAF8F4] border border-[#E8E5DF] p-4 space-y-3">
                {/* Live Camera Viewport */}
                <div className="relative w-full h-56 rounded-[12px] bg-[#1C1B19] overflow-hidden border border-[#E8E5DF] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Laser Barcode Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div
                      className={`w-full max-w-[260px] h-32 rounded-[12px] border-2 transition-colors relative flex items-center justify-center ${
                        scannedBarcodeValue
                          ? 'border-[#34D399] bg-[#34D399]/10'
                          : 'border-white/80'
                      }`}
                    >
                      {/* Red/Navy Laser Guide Line for 1D Supermarket Barcodes */}
                      <div
                        className={`w-11/12 h-[2px] ${
                          scannedBarcodeValue ? 'bg-[#34D399]' : 'bg-[#EF4444]'
                        } shadow-sm`}
                      />
                    </div>
                  </div>

                  {/* Top Camera Controls Overlay */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-[8px] bg-black/70 text-white font-label text-[11px] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#34D399]" />
                      <span>
                        {cameraStatus === 'scanning'
                          ? 'Kamera Aktif · Siap Scan Barcode Produk'
                          : cameraStatus === 'starting'
                          ? 'Menyalakan Kamera...'
                          : 'Mode Simulasi Kamera'}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) =>
                          prev === 'environment' ? 'user' : 'environment'
                        )
                      }
                      title="Ganti Kamera Depan/Belakang"
                      className="h-8 px-2.5 rounded-[8px] bg-black/70 hover:bg-black text-white font-label text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Balik Kamera</span>
                    </button>
                  </div>
                </div>

                {/* Scanned Barcode Result Banner */}
                {scannedBarcodeValue ? (
                  <div className="p-3.5 rounded-[12px] bg-[#E8F5EE] border border-[#1a2469]/30 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-[12px] font-label font-semibold text-[#1a2469]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Barcode Berhasil Terbaca! ({scannedFormatName || 'BARCODE'})</span>
                      </div>
                      <p className="text-[16px] font-bold text-[#1C1B19] tabular-nums truncate">
                        Kode: {scannedBarcodeValue}
                      </p>
                      <p className="text-[12px] text-[#63625D]">
                        Terhubung otomatis ke Unit {activePreviewBike?.id} · Siap dibuka
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScannedBarcodeValue(null)}
                      className="px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E8E5DF] text-[12px] font-label font-medium text-[#1C1B19] hover:bg-[#FAF8F4] shrink-0"
                    >
                      Scan Ulang
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                    <p className="text-[13px] text-[#63625D]">
                      Arahkan barcode kemasan produk supermarket (EAN-13, Code-128) atau QR apa saja ke depan kamera.
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulateProductBarcode}
                      className="min-h-[38px] px-3 py-1.5 rounded-[10px] border border-[#1a2469]/30 bg-white hover:bg-[#FAF8F4] text-[#1a2469] font-label font-semibold text-[12px] flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Tes Scan Barcode Produk</span>
                    </button>
                  </div>
                )}

                {cameraError && (
                  <p className="text-[12px] text-[#4f1c00] bg-[#FEE2E2] p-2.5 rounded-[10px]">
                    {cameraError}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="bike-pin-input"
                  className="block font-label text-[14px] font-medium text-[#1C1B19]"
                >
                  Masukkan 3 Digit Nomor Sepeda (Contoh: 104, 108, 219, 302)
                </label>
                <div className="flex items-center gap-2">
                  <span className="h-12 px-4 rounded-[12px] bg-[#FAF8F4] border border-[#E8E5DF] flex items-center font-label font-semibold text-[16px] text-[#63625D] select-none">
                    GS -
                  </span>
                  <input
                    id="bike-pin-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="104"
                    className="w-full h-12 px-4 rounded-[12px] bg-white border border-[#E8E5DF] text-[20px] font-semibold tracking-[0.15em] text-[#1C1B19] tabular-nums focus:outline-none focus:border-[#1a2469] focus:ring-2 focus:ring-[#1a2469]/20"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[12px] text-[#8F8E89] font-label">
                    Pilih cepat unit tersedia:
                  </span>
                  {['104', '108', '219', '302', '405'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setManualCode(code)}
                      className={`px-2.5 py-1 rounded-[8px] font-label text-[12px] tabular-nums border transition-colors ${
                        manualCode === code
                          ? 'bg-[#1a2469] text-white border-[#1a2469]'
                          : 'bg-[#FAF8F4] text-[#1C1B19] border-[#E8E5DF] hover:border-[#1a2469]'
                      }`}
                    >
                      GS-{code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Bike Telemetry Summary Row */}
            {activePreviewBike && (
              <div className="rounded-[12px] bg-[#FAF8F4] border border-[#E8E5DF] p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[10px] bg-white border border-[#E8E5DF] flex items-center justify-center text-[#1a2469] shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[16px] text-[#1C1B19] tabular-nums">
                        Unit {activePreviewBike.id}
                      </span>
                      <span className="text-[#8F8E89]">·</span>
                      <span className="text-[13px] text-[#63625D]">{activePreviewBike.type}</span>
                    </div>
                    <p className="text-[13px] text-[#63625D] truncate">
                      {activePreviewBike.dockNumber} · {activePreviewBike.gearCondition}
                    </p>
                  </div>
                </div>
                {activePreviewBike.batteryPercent !== undefined && (
                  <div className="flex items-center gap-1 text-[13px] font-label font-semibold text-[#1a2469] tabular-nums shrink-0">
                    <BatteryCharging className="w-4 h-4" />
                    <span>{activePreviewBike.batteryPercent}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Pre-ride Safety Checkbox (48px touch zone) */}
            <label className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-[12px] hover:bg-[#FAF8F4] cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={safetyChecked}
                onChange={(e) => setSafetyChecked(e.target.checked)}
                className="w-5 h-5 rounded-[4px] accent-[#1a2469] border-[#E8E5DF] cursor-pointer shrink-0"
              />
              <span className="text-[14px] text-[#1C1B19] leading-5">
                Saya telah memeriksa fungsi rem, tekanan ban, dan berada di jalur sepeda kampus.
              </span>
            </label>

            {errorMessage && (
              <div className="p-3 rounded-[10px] bg-[#FEE2E2] text-[#4f1c00] text-[13px] font-medium">
                {errorMessage}
              </div>
            )}

            {/* Tariff & Quota Reassurance */}
            <div className="flex items-center justify-between text-[13px] text-[#63625D] pt-1 border-t border-[#E8E5DF]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1a2469]" />
                <span>Bebas biaya 30 menit pertama</span>
              </span>
              <span className="font-label font-semibold text-[#1C1B19] tabular-nums">
                Rp 0 / Sivitas
              </span>
            </div>

            {/* Primary CTA Button (52px height on mobile, 14px radius) */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/3 min-h-[48px] px-4 py-2.5 rounded-[14px] border-[1.5px] border-[#E8E5DF] bg-white text-[#1C1B19] font-label font-semibold text-[15px] hover:bg-[#FAF8F4] transition-colors whitespace-nowrap"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full sm:w-2/3 min-h-[52px] px-5 py-3 rounded-[14px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[16px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  {scannedBarcodeValue
                    ? `Buka Kunci (${scannedBarcodeValue.slice(0, 8)}...)`
                    : 'Mulai Perjalanan'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

