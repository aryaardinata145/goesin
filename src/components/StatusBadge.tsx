import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { BikeStatus } from '../data/campusData';

interface StatusBadgeProps {
  status: BikeStatus;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel }) => {
  switch (status) {
    case 'Tersedia':
      return (
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-[#E8F5EE] text-[#1a2469] font-label text-[12px] font-medium leading-4 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2] shrink-0" />
          <span>{customLabel || 'Tersedia'}</span>
        </span>
      );
    case 'Sedang Digunakan':
      return (
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-[#FEF3C7] text-[#727594] font-label text-[12px] font-medium leading-4 whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 stroke-[2] shrink-0" />
          <span>{customLabel || 'Sedang Digunakan'}</span>
        </span>
      );
    case 'Perbaikan':
      return (
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-[#FEE2E2] text-[#4f1c00] font-label text-[12px] font-medium leading-4 whitespace-nowrap shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2] shrink-0" />
          <span>{customLabel || 'Perbaikan / Kendala'}</span>
        </span>
      );
    case 'Habis':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-[#F3F4F6] text-[#9CA3AF] font-label text-[12px] font-medium leading-4 whitespace-nowrap shrink-0">
          <Ban className="w-3.5 h-3.5 stroke-[2] shrink-0" />
          <span>{customLabel || 'Habis'}</span>
        </span>
      );
  }
};
