import React from 'react';

/**
 * Dimension line — section dividers, with an end tick and a mono label.
 * Replaces plain rules everywhere in CW-01 standard.
 */
export const DimensionLine: React.FC<{
  label?: string;
  theme?: 'cream' | 'navy';
  className?: string;
}> = ({ label, theme = 'navy', className = '' }) => {
  const isNavy = theme === 'navy';
  const lineColor = isNavy ? 'border-[#7FD8E8]/40' : 'border-[#0E1E3C]/30';
  const tickColor = isNavy ? 'bg-[#7FD8E8]' : 'bg-[#0E1E3C]';
  const textColor = isNavy ? 'text-[#7FD8E8]' : 'text-[#0E1E3C]/80';

  return (
    <div className={`relative flex items-center my-4 select-none ${className}`}>
      {/* Left tick */}
      <div className={`w-[2px] h-[10px] ${tickColor}`} />
      {/* Left horizontal dimension line */}
      <div className={`flex-1 border-t ${lineColor}`} />

      {/* Center mono label if present */}
      {label && (
        <span
          className={`px-3 font-mono text-[10px] tracking-widest uppercase font-semibold ${textColor}`}
        >
          {label}
        </span>
      )}

      {/* Right horizontal dimension line */}
      <div className={`flex-1 border-t ${lineColor}`} />
      {/* Right tick */}
      <div className={`w-[2px] h-[10px] ${tickColor}`} />
    </div>
  );
};

/**
 * Rubber stamps — status chips: SYNCED, PENDING, OFFLINE, FIELD TESTED.
 * 2pt border, ±3° rotation, mono caps. Teal = verified, orange = needs action.
 */
export const RubberStamp: React.FC<{
  status: 'SYNCED' | 'PENDING' | 'OFFLINE' | 'FIELD TESTED' | 'HEALTHY' | 'SILENT' | 'FAULTY';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ status, size = 'md', className = '' }) => {
  const isVerified = status === 'SYNCED' || status === 'FIELD TESTED' || status === 'HEALTHY';
  const isOrange = status === 'PENDING' || status === 'FAULTY' || status === 'SILENT';

  // Rotation: Teal -2.5deg, Orange +2.5deg
  const rotation = isVerified ? '-rotate-2' : 'rotate-2';

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 border',
    md: 'text-[11px] px-2.5 py-0.5 border-2',
    lg: 'text-[13px] px-3.5 py-1 border-2',
  }[size];

  const colorClasses = isVerified
    ? 'border-[#1F8F82] text-[#1F8F82] bg-[#1F8F82]/10'
    : isOrange
    ? 'border-[#F05A28] text-[#F05A28] bg-[#F05A28]/10'
    : 'border-[#7FD8E8] text-[#7FD8E8] bg-[#7FD8E8]/10';

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold tracking-wider uppercase select-none transition-transform ${rotation} ${sizeClasses} ${colorClasses} ${className}`}
    >
      {status}
    </span>
  );
};

/**
 * Crosshair / registration mark — the "look here" marker.
 * Used on the device card for the currently selected unit, and in empty states.
 */
export const CrosshairMark: React.FC<{
  size?: number;
  color?: string;
  className?: string;
}> = ({ size = 20, color = '#7FD8E8', className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="8" strokeOpacity="0.4" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="2" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  );
};

/**
 * Orbit ring — marks "Deeper Orbit" disclosure:
 * advanced or diagnostic detail folded behind a tap.
 */
export const OrbitRing: React.FC<{
  isOpen?: boolean;
  onClick?: () => void;
  label?: string;
  badge?: string | number;
  className?: string;
}> = ({ isOpen = false, onClick, label = 'DEEPER ORBIT DIAGNOSTICS', badge, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center justify-between w-full py-2.5 px-3 border border-[#7FD8E8]/30 bg-[#0E1E3C]/60 hover:bg-[#16336E]/40 text-[#7FD8E8] transition-all cursor-pointer select-none ${className}`}
    >
      <div className="flex items-center space-x-2.5">
        {/* Dual concentric orbit rings with rotating satellite marker */}
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border border-[#7FD8E8]/40" />
          <div className="w-2.5 h-2.5 rounded-full border border-[#F2B33D]" />
          <div
            className={`w-1 h-1 rounded-full bg-[#7FD8E8] transition-transform duration-500 ${
              isOpen ? 'rotate-180 scale-125' : ''
            }`}
          />
        </div>
        <span className="font-mono text-[11px] tracking-wider font-semibold uppercase">
          {label}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {badge !== undefined && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#F2B33D]/20 text-[#F2B33D] font-bold">
            {badge}
          </span>
        )}
        <span
          className={`font-mono text-xs text-[#7FD8E8] transition-transform duration-300 ${
            isOpen ? 'rotate-90' : ''
          }`}
        >
          ►
        </span>
      </div>
    </button>
  );
};

/**
 * Mission patch — circular badge used for merchant streaks and product identity.
 */
export const MissionPatch: React.FC<{
  label: string;
  sub?: string;
  theme?: 'gold' | 'teal' | 'rocket';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ label, sub, theme = 'gold', size = 'md', className = '' }) => {
  const isGold = theme === 'gold';
  const isTeal = theme === 'teal';

  const borderColor = isGold
    ? 'border-[#F2B33D]'
    : isTeal
    ? 'border-[#1F8F82]'
    : 'border-[#F05A28]';
  const textColor = isGold ? 'text-[#F2B33D]' : isTeal ? 'text-[#1F8F82]' : 'text-[#F05A28]';

  const dimensions = size === 'sm' ? 'w-11 h-11' : 'w-14 h-14';

  return (
    <div
      className={`relative rounded-full border-2 ${borderColor} bg-[#0E1E3C] flex flex-col items-center justify-center p-1 shadow-inner select-none ${dimensions} ${className}`}
    >
      <div className="absolute inset-0.5 rounded-full border border-dashed border-current opacity-40" />
      <span className={`font-mono font-bold text-[10px] uppercase tracking-tighter ${textColor}`}>
        {label}
      </span>
      {sub && (
        <span className="font-mono text-[7px] text-[#F2EAD6]/80 uppercase tracking-widest">
          {sub}
        </span>
      )}
    </div>
  );
};

/**
 * Starburst — victory only, and rarely.
 * First successful sync of a new bin. Match won. Maximum one on screen.
 */
export const Starburst: React.FC<{
  message?: string;
  submessage?: string;
  onDismiss?: () => void;
}> = ({ message = 'BIN SYNCED', submessage = '412 votes carried home.', onDismiss }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1E3C]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative max-w-sm w-full bg-[#16336E] border-2 border-[#F2B33D] p-6 text-center shadow-2xl">
        {/* Starburst rays background */}
        <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-full h-full animate-[spin_12s_linear_infinite]"
            viewBox="0 0 100 100"
            fill="none"
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <polygon
                key={i}
                points="50,50 47,8 53,8"
                fill={i % 2 === 0 ? '#F2B33D' : '#7FD8E8'}
                transform={`rotate(${i * 22.5} 50 50)`}
                opacity={0.85}
              />
            ))}
          </svg>
          <div className="absolute w-12 h-12 rounded-full bg-[#0E1E3C] border-2 border-[#F2B33D] flex items-center justify-center">
            <span className="text-[#F2B33D] text-lg font-bold">★</span>
          </div>
        </div>

        <h3 className="font-michroma text-lg text-[#F2EAD6] tracking-wide mb-1 uppercase">
          {message}
        </h3>
        <p className="font-mono text-xs text-[#7FD8E8] mb-5 tracking-wide">{submessage}</p>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 bg-[#F05A28] hover:bg-[#d84818] text-[#F2EAD6] font-archivo font-bold uppercase tracking-wider text-sm transition-colors cursor-pointer"
        >
          CONFIRM & PROCEED
        </button>
      </div>
    </div>
  );
};

/**
 * Trace path — 90°/45° connector lines with gold vias at corners.
 * Used to show device → phone → server on the sync screen.
 * This is the app's signature animation!
 */
export const TracePathAnimation: React.FC<{
  phase: 'idle' | 'ble_connecting' | 'draining_device' | 'uploading_server' | 'complete' | 'failed';
  batchCount?: number;
}> = ({ phase, batchCount = 0 }) => {
  const isBleActive =
    phase === 'ble_connecting' || phase === 'draining_device' || phase === 'uploading_server';
  const isPhoneActive =
    phase === 'draining_device' || phase === 'uploading_server' || phase === 'complete';
  const isServerActive = phase === 'uploading_server' || phase === 'complete';

  return (
    <div className="w-full py-5 px-3 bg-[#0E1E3C] border border-[#7FD8E8]/40 my-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] text-[#7FD8E8] tracking-widest uppercase">
          TWO-PHASE COURIER PIPELINE
        </span>
        <span className="font-mono text-[9px] text-[#F2B33D]">
          {phase === 'complete'
            ? 'ACKNOWLEDGED'
            : phase === 'failed'
            ? 'INTERRUPTED'
            : 'IN PROGRESS'}
        </span>
      </div>

      <div className="relative flex items-center justify-between px-2 pt-2 pb-1">
        {/* Device Node */}
        <div className="flex flex-col items-center z-10">
          <div
            className={`w-9 h-9 border-2 flex items-center justify-center font-mono font-bold text-xs transition-colors ${
              isBleActive
                ? 'border-[#1F8F82] text-[#1F8F82] bg-[#1F8F82]/20'
                : 'border-[#7FD8E8]/40 text-[#7FD8E8]/60 bg-[#16336E]'
            }`}
          >
            ESP32
          </div>
          <span className="font-mono text-[8px] mt-1 text-[#F2EAD6]/80 uppercase">BIN (TRUTH)</span>
        </div>

        {/* 90°/45° Circuit Trace Line 1 (Device -> Phone) */}
        <div className="flex-1 relative h-8 mx-1 flex items-center">
          <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 24">
            {/* Trace path */}
            <path
              d="M 0 12 L 40 12 L 50 6 L 90 6 L 100 12"
              stroke="#7FD8E8"
              strokeWidth="2"
              strokeOpacity="0.3"
              fill="none"
            />
            {/* Active flow */}
            {isBleActive && (
              <path
                d="M 0 12 L 40 12 L 50 6 L 90 6 L 100 12"
                stroke="#1F8F82"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                fill="none"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}
            {/* Gold vias at corners */}
            <circle cx="40" cy="12" r="2.5" fill="#F2B33D" />
            <circle cx="50" cy="6" r="2.5" fill="#F2B33D" />
            <circle cx="90" cy="6" r="2.5" fill="#F2B33D" />
          </svg>
        </div>

        {/* Phone Courier Node */}
        <div className="flex flex-col items-center z-10">
          <div
            className={`w-9 h-9 border-2 flex items-center justify-center font-mono font-bold text-xs transition-colors ${
              isPhoneActive
                ? 'border-[#F2B33D] text-[#F2B33D] bg-[#F2B33D]/20 animate-pulse'
                : 'border-[#7FD8E8]/40 text-[#7FD8E8]/60 bg-[#16336E]'
            }`}
          >
            PHONE
          </div>
          <span className="font-mono text-[8px] mt-1 text-[#F2EAD6]/80 uppercase">COURIER</span>
        </div>

        {/* Circuit Trace Line 2 (Phone -> Cloud Server) */}
        <div className="flex-1 relative h-8 mx-1 flex items-center">
          <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 100 24">
            <path
              d="M 0 12 L 35 12 L 45 18 L 85 18 L 100 12"
              stroke="#7FD8E8"
              strokeWidth="2"
              strokeOpacity="0.3"
              fill="none"
            />
            {isServerActive && (
              <path
                d="M 0 12 L 35 12 L 45 18 L 85 18 L 100 12"
                stroke="#1F8F82"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                fill="none"
                className="animate-[dash_1s_linear_infinite]"
              />
            )}
            <circle cx="35" cy="12" r="2.5" fill="#F2B33D" />
            <circle cx="45" cy="18" r="2.5" fill="#F2B33D" />
            <circle cx="85" cy="18" r="2.5" fill="#F2B33D" />
          </svg>
        </div>

        {/* Server Node */}
        <div className="flex flex-col items-center z-10">
          <div
            className={`w-9 h-9 border-2 flex items-center justify-center font-mono font-bold text-xs transition-colors ${
              isServerActive
                ? 'border-[#1F8F82] text-[#1F8F82] bg-[#1F8F82]/20'
                : 'border-[#7FD8E8]/40 text-[#7FD8E8]/60 bg-[#16336E]'
            }`}
          >
            SERVER
          </div>
          <span className="font-mono text-[8px] mt-1 text-[#F2EAD6]/80 uppercase">DEDUP</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="font-mono text-[10px] text-[#7FD8E8]">
          {phase === 'ble_connecting' && 'CONNECTING VIA BLE · CHECKING CLOCK DRIFT...'}
          {phase === 'draining_device' && 'DRAINING RING BUFFER → PHONE OUTBOX...'}
          {phase === 'uploading_server' && 'DELIVERING BATCH TO SERVER → AWAITING HIGH-WATER ACK...'}
          {phase === 'complete' && `SYNC COMPLETE · ${batchCount} VOTES COMMITTED`}
          {phase === 'failed' && 'SYNC INTERRUPTED · PARTIAL CACHE RETAINED'}
          {phase === 'idle' && 'READY TO SYNC · PHONE AS COURIER'}
        </span>
      </div>
    </div>
  );
};
