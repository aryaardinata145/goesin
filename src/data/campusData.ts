import rectorateImg from '../assets/images/campus_station_rectorate_1791384986707.jpg';
import engineeringImg from '../assets/images/campus_station_engineering_1791385004198.jpg';
import avatarImg from '../assets/images/student_avatar_nadia_1791385017630.jpg';

export type BikeStatus = 'Tersedia' | 'Sedang Digunakan' | 'Perbaikan' | 'Habis';

export interface BikeUnit {
  id: string;
  stationId: string;
  type: 'Elektrik' | 'Mekanik';
  status: BikeStatus;
  batteryPercent?: number;
  gearCondition: string;
  dockNumber: string;
  lastChecked: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  facultyZone: string;
  walkingDistance: string;
  address: string;
  availableCount: number;
  totalDocks: number;
  emptyDocks: number;
  status: BikeStatus;
  coordinates: { x: number; y: number }; // Percentage on interactive campus map
  imageUrl?: string;
  operatingHours: string;
  bikes: BikeUnit[];
}

export interface RideHistoryItem {
  id: string;
  bikeId: string;
  bikeType: 'Elektrik' | 'Mekanik';
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  fromStation: string;
  toStation: string;
  distanceKm: number;
  quotaUsedMinutes: number;
  extraFeeRp: number;
  status: 'Selesai' | 'Tepat Waktu';
}

export interface MaintenanceReport {
  id: string;
  bikeId: string;
  stationName: string;
  issueCategories: string[];
  severity: 'Ringan' | 'Sedang' | 'Darurat';
  notes: string;
  submittedAt: string;
  status: 'Menunggu Teknisi' | 'Sedang Diperiksa' | 'Selesai Diperbaiki';
}

export interface UserAccount {
  id: string;
  npmOrUsername: string;
  name: string;
  role: 'student' | 'admin';
  faculty: string;
  avatar: string;
}

export const DUMMY_ACCOUNTS: Record<string, { password: string; user: UserAccount }> = {
  G1A026040: {
    password: '12345678',
    user: {
      id: 'usr-student-1',
      npmOrUsername: 'G1A026040',
      name: 'Nadia Putri Pramesti',
      role: 'student',
      faculty: 'Fakultas Teknik — Informatika',
      avatar: avatarImg,
    },
  },
  ADMIN: {
    password: '12345678',
    user: {
      id: 'usr-admin-1',
      npmOrUsername: 'admin',
      name: 'Koordinator Teknisi Goesin',
      role: 'admin',
      faculty: 'Unit Layanan Transportasi Kampus',
      avatar: avatarImg,
    },
  },
};

export const STUDENT_PROFILE = {
  name: 'Nadia Putri Pramesti',
  nim: 'G1A026040',
  faculty: 'Fakultas Teknik — Informatika',
  avatar: avatarImg,
  freeQuotaRemainingMinutes: 45,
  dailyFreeQuotaMaxMinutes: 60,
  campusPassStatus: 'Aktif · Semester Gasal 2026/2027',
  walletBalanceRp: 24500,
  totalRidesSemester: 38,
  totalDistanceKm: 64.2,
  co2SavedKg: 9.8,
};

export const INITIAL_STATIONS: Station[] = [
  {
    id: 'st-perpustakaan',
    name: 'Stasiun Perpustakaan Pusat',
    code: 'ST-01',
    facultyZone: 'Zona Rektorat & Pusat Studi',
    walkingDistance: '3 menit dari Perpustakaan Pusat',
    address: 'Jl. Lingkar Utara Kampus, Sisi Barat Plaza Utama',
    availableCount: 12,
    totalDocks: 16,
    emptyDocks: 4,
    status: 'Tersedia',
    coordinates: { x: 46, y: 38 },
    imageUrl: rectorateImg,
    operatingHours: '06.00 – 22.00 WIB',
    bikes: [
      {
        id: 'GS-104',
        stationId: 'st-perpustakaan',
        type: 'Elektrik',
        status: 'Tersedia',
        batteryPercent: 94,
        gearCondition: 'Prima · Keranjang Depan',
        dockNumber: 'Dock A-01',
        lastChecked: '15 menit lalu',
      },
      {
        id: 'GS-108',
        stationId: 'st-perpustakaan',
        type: 'Elektrik',
        status: 'Tersedia',
        batteryPercent: 82,
        gearCondition: 'Prima · Lampu Otomatis',
        dockNumber: 'Dock A-02',
        lastChecked: '28 menit lalu',
      },
      {
        id: 'GS-219',
        stationId: 'st-perpustakaan',
        type: 'Mekanik',
        status: 'Tersedia',
        gearCondition: '3-Speed Shimano · Ringan',
        dockNumber: 'Dock A-04',
        lastChecked: '1 jam lalu',
      },
      {
        id: 'GS-224',
        stationId: 'st-perpustakaan',
        type: 'Mekanik',
        status: 'Tersedia',
        gearCondition: '3-Speed Shimano · Prima',
        dockNumber: 'Dock A-05',
        lastChecked: '40 menit lalu',
      },
      {
        id: 'GS-115',
        stationId: 'st-perpustakaan',
        type: 'Elektrik',
        status: 'Sedang Digunakan',
        batteryPercent: 68,
        gearCondition: 'Dipinjam 12 menit lalu',
        dockNumber: 'Rute Aktif',
        lastChecked: 'Aktif',
      },
    ],
  },
  {
    id: 'st-teknik',
    name: 'Stasiun Fakultas Teknik (Plaza KPFT)',
    code: 'ST-02',
    facultyZone: 'Zona Sains & Rekayasa',
    walkingDistance: '2 menit dari Gedung Dekanat Teknik',
    address: 'Jl. Grafika No. 2, Selasar Timur Taman Teknik',
    availableCount: 8,
    totalDocks: 14,
    emptyDocks: 6,
    status: 'Tersedia',
    coordinates: { x: 26, y: 26 },
    imageUrl: engineeringImg,
    operatingHours: '06.00 – 22.00 WIB',
    bikes: [
      {
        id: 'GS-302',
        stationId: 'st-teknik',
        type: 'Elektrik',
        status: 'Tersedia',
        batteryPercent: 89,
        gearCondition: 'Prima · Ban Baru',
        dockNumber: 'Dock B-01',
        lastChecked: '10 menit lalu',
      },
      {
        id: 'GS-309',
        stationId: 'st-teknik',
        type: 'Mekanik',
        status: 'Tersedia',
        gearCondition: '3-Speed · Rem Pakem',
        dockNumber: 'Dock B-03',
        lastChecked: '35 menit lalu',
      },
      {
        id: 'GS-314',
        stationId: 'st-teknik',
        type: 'Elektrik',
        status: 'Tersedia',
        batteryPercent: 76,
        gearCondition: 'Prima · Bel Nyaring',
        dockNumber: 'Dock B-06',
        lastChecked: '50 menit lalu',
      },
      {
        id: 'GS-318',
        stationId: 'st-teknik',
        type: 'Mekanik',
        status: 'Perbaikan',
        gearCondition: 'Rantai kendor · Menunggu teknisi',
        dockNumber: 'Dock B-08 (Terkunci)',
        lastChecked: 'Dilaporkan 09.15',
      },
    ],
  },
  {
    id: 'st-feb',
    name: 'Stasiun Ekonomika & Bisnis (FEB)',
    code: 'ST-03',
    facultyZone: 'Zona Sosio-Humaniora',
    walkingDistance: '4 menit dari Auditorium FEB',
    address: 'Jl. Sosio Humaniora No. 1, Pintu Selatan Kantin',
    availableCount: 5,
    totalDocks: 12,
    emptyDocks: 7,
    status: 'Tersedia',
    coordinates: { x: 72, y: 42 },
    imageUrl: rectorateImg,
    operatingHours: '06.00 – 21.00 WIB',
    bikes: [
      {
        id: 'GS-401',
        stationId: 'st-feb',
        type: 'Mekanik',
        status: 'Tersedia',
        gearCondition: '3-Speed · Sadel Empuk',
        dockNumber: 'Dock C-02',
        lastChecked: '20 menit lalu',
      },
      {
        id: 'GS-405',
        stationId: 'st-feb',
        type: 'Elektrik',
        status: 'Tersedia',
        batteryPercent: 91,
        gearCondition: 'Prima · Siap Tanjakan',
        dockNumber: 'Dock C-04',
        lastChecked: '18 menit lalu',
      },
    ],
  },
  {
    id: 'st-kedokteran',
    name: 'Stasiun FK-KMK & RS Akademik',
    code: 'ST-04',
    facultyZone: 'Zona Kesehatan & Medis',
    walkingDistance: '1 menit dari Gedung Radiopoetro',
    address: 'Jl. Farmako Sekip Utara, Koridor Barat Medika',
    availableCount: 2,
    totalDocks: 10,
    emptyDocks: 8,
    status: 'Sedang Digunakan',
    coordinates: { x: 22, y: 64 },
    imageUrl: engineeringImg,
    operatingHours: '05.30 – 22.30 WIB',
    bikes: [
      {
        id: 'GS-512',
        stationId: 'st-kedokteran',
        type: 'Elektrik',
        status: 'Tersedia',
        batteryPercent: 64,
        gearCondition: 'Prima · Keranjang Dokumen',
        dockNumber: 'Dock D-01',
        lastChecked: '45 menit lalu',
      },
      {
        id: 'GS-519',
        stationId: 'st-kedokteran',
        type: 'Mekanik',
        status: 'Tersedia',
        gearCondition: '3-Speed · Normal',
        dockNumber: 'Dock D-05',
        lastChecked: '1 jam lalu',
      },
    ],
  },
  {
    id: 'st-gelanggang',
    name: 'Stasiun Gelanggang Mahasiswa (GIK)',
    code: 'ST-05',
    facultyZone: 'Zona Kemahasiswaan & Halte Trans',
    walkingDistance: '5 menit dari Halte Bus Kampus',
    address: 'Jl. Pancasila Bulaksumur, Gerbang Selatan GIK',
    availableCount: 0,
    totalDocks: 12,
    emptyDocks: 12,
    status: 'Habis',
    coordinates: { x: 56, y: 74 },
    imageUrl: rectorateImg,
    operatingHours: '06.00 – 22.00 WIB',
    bikes: [
      {
        id: 'GS-604',
        stationId: 'st-gelanggang',
        type: 'Elektrik',
        status: 'Sedang Digunakan',
        batteryPercent: 78,
        gearCondition: 'Sedang menuju Stasiun FEB',
        dockNumber: 'Rute Aktif',
        lastChecked: 'Aktif',
      },
    ],
  },
  {
    id: 'st-mipa',
    name: 'Stasiun FMIPA Selatan',
    code: 'ST-06',
    facultyZone: 'Zona Sains & Rekayasa',
    walkingDistance: '3 menit dari Laboratorium Kimia Dasar',
    address: 'Sekip Utara BLS 21, Parkir Terpadu Timur',
    availableCount: 1,
    totalDocks: 8,
    emptyDocks: 7,
    status: 'Perbaikan',
    coordinates: { x: 40, y: 18 },
    imageUrl: engineeringImg,
    operatingHours: '06.30 – 21.00 WIB',
    bikes: [
      {
        id: 'GS-701',
        stationId: 'st-mipa',
        type: 'Elektrik',
        status: 'Perbaikan',
        batteryPercent: 14,
        gearCondition: 'Baterai rendah & kalibrasi kunci pintar',
        dockNumber: 'Dock F-02 (Terkunci)',
        lastChecked: 'Dalam penanganan',
      },
      {
        id: 'GS-708',
        stationId: 'st-mipa',
        type: 'Mekanik',
        status: 'Tersedia',
        gearCondition: '3-Speed · Prima',
        dockNumber: 'Dock F-04',
        lastChecked: '25 menit lalu',
      },
    ],
  },
];

export const INITIAL_RIDE_HISTORY: RideHistoryItem[] = [
  {
    id: 'TR-9841',
    bikeId: 'GS-104',
    bikeType: 'Elektrik',
    date: 'Hari ini, 07 Okt 2026',
    startTime: '07.15',
    endTime: '07.27',
    durationMinutes: 12,
    fromStation: 'Stasiun Gelanggang Mahasiswa (GIK)',
    toStation: 'Stasiun Fakultas Teknik (Plaza KPFT)',
    distanceKm: 1.8,
    quotaUsedMinutes: 12,
    extraFeeRp: 0,
    status: 'Tepat Waktu',
  },
  {
    id: 'TR-9812',
    bikeId: 'GS-219',
    bikeType: 'Mekanik',
    date: 'Kemarin, 06 Okt 2026',
    startTime: '15.40',
    endTime: '15.58',
    durationMinutes: 18,
    fromStation: 'Stasiun Perpustakaan Pusat',
    toStation: 'Stasiun Gelanggang Mahasiswa (GIK)',
    distanceKm: 2.1,
    quotaUsedMinutes: 18,
    extraFeeRp: 0,
    status: 'Selesai',
  },
  {
    id: 'TR-9775',
    bikeId: 'GS-405',
    bikeType: 'Elektrik',
    date: 'Senin, 05 Okt 2026',
    startTime: '12.10',
    endTime: '12.24',
    durationMinutes: 14,
    fromStation: 'Stasiun Fakultas Teknik (Plaza KPFT)',
    toStation: 'Stasiun Ekonomika & Bisnis (FEB)',
    distanceKm: 1.9,
    quotaUsedMinutes: 14,
    extraFeeRp: 0,
    status: 'Tepat Waktu',
  },
  {
    id: 'TR-9720',
    bikeId: 'GS-302',
    bikeType: 'Elektrik',
    date: 'Jumat, 02 Okt 2026',
    startTime: '09.05',
    endTime: '09.42',
    durationMinutes: 37,
    fromStation: 'Stasiun FK-KMK & RS Akademik',
    toStation: 'Stasiun Perpustakaan Pusat',
    distanceKm: 3.4,
    quotaUsedMinutes: 30,
    extraFeeRp: 2000,
    status: 'Selesai',
  },
];

export const INITIAL_REPORTS: MaintenanceReport[] = [
  {
    id: 'LP-402',
    bikeId: 'GS-318',
    stationName: 'Stasiun Fakultas Teknik (Plaza KPFT)',
    issueCategories: ['Rantai / Pedal Kendor', 'Rem Kurang Pakem'],
    severity: 'Sedang',
    notes: 'Rantai sedikit berbunyi saat pindah gigi 2 ke 3 di tanjakan dekat gedung departemen.',
    submittedAt: '06 Okt 2026 · 16.20 WIB',
    status: 'Sedang Diperiksa',
  },
];
