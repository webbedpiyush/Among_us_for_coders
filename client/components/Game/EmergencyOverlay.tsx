"use client";

import { Icon } from "@iconify/react";

interface EmergencyOverlayProps {
  callerName: string;
  onClose?: () => void;
}

export default function EmergencyOverlay({
  callerName,
  onClose,
}: EmergencyOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#F5DEB3] border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] px-10 py-8 text-center font-mono">
        <div className="flex items-center justify-center gap-3 text-[#ff4757] mb-4">
          <Icon icon="lucide:siren" width="36" className="animate-pulse" />
          <h1 className="text-3xl font-bold tracking-widest">
            EMERGENCY MEETING
          </h1>
          <Icon icon="lucide:siren" width="36" className="animate-pulse" />
        </div>
        <p className="text-black font-bold text-lg mb-6">
          {callerName} called a meeting!
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-[#4cd137] hover:bg-[#44bd32] text-white font-bold py-2 px-6 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
            CLOSE
          </button>
        )}
      </div>
    </div>
  );
}
