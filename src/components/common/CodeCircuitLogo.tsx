import React from 'react';

interface CodeCircuitLogoProps {
  size?: number;
  className?: string;
  sparkColor?: string;
  strokeColor?: string;
  interactive?: boolean;
}

/**
 * Code & Circuit (C&C) Official Brand Mark
 * Recreated with mathematical vector precision from brand asset
 * Outer circuit "C" ring + Terminal console window `>_` + Radiating laser spark
 */
export const CodeCircuitLogo: React.FC<CodeCircuitLogoProps> = ({
  size = 48,
  className = '',
  sparkColor = '#7FD8E8',
  strokeColor = '#F2EAD6',
  interactive = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${interactive ? 'hover:scale-105 transition-transform duration-300' : ''} ${className}`}
      style={{ width: size, height: size }}
      title="Code & Circuit — Cosmic Workshop"
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(127,216,232,0.25)]"
      >
        {/* Outer Circular Circuit 'C' Track */}
        {/* Outer perimeter arc */}
        <path
          d="M 140 45 A 82 82 0 1 0 140 155"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Inner perimeter arc of the 'C' */}
        <path
          d="M 120 70 A 58 58 0 1 0 120 130"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Top circuit trace & nodes inside C */}
        <path
          d="M 80 32 L 80 44 L 115 44"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="122" cy="44" r="5" stroke={strokeColor} strokeWidth="3" fill="#0E1E3C" />

        <path
          d="M 44 80 L 58 80 L 58 56"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="58" cy="50" r="4.5" stroke={strokeColor} strokeWidth="3" fill="#0E1E3C" />

        {/* Bottom circuit trace & nodes inside C */}
        <path
          d="M 64 150 L 80 150 L 98 168"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="60" cy="150" r="4.5" stroke={strokeColor} strokeWidth="3" fill="#0E1E3C" />
        <circle cx="102" cy="172" r="4.5" stroke={strokeColor} strokeWidth="3" fill="#0E1E3C" />

        <path
          d="M 112 165 L 126 150 L 138 150"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="144" cy="150" r="4.5" stroke={strokeColor} strokeWidth="3" fill="#0E1E3C" />

        {/* Middle terminal window (rounded box) */}
        <rect
          x="68"
          y="72"
          width="64"
          height="56"
          rx="10"
          stroke={strokeColor}
          strokeWidth="6"
          fill="#0E1E3C"
        />

        {/* Terminal prompt symbol: `>` and `_` */}
        <path
          d="M 82 86 L 98 100 L 82 114"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="102"
          y1="114"
          x2="120"
          y2="114"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Horizontal connector line emerging from terminal toward spark */}
        <line
          x1="132"
          y1="100"
          x2="155"
          y2="100"
          stroke={strokeColor}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Radiating Laser Spark / Starburst */}
        <g transform="translate(156, 100)">
          {/* Main 8 long rays */}
          <line x1="-24" y1="0" x2="24" y2="0" stroke={sparkColor} strokeWidth="2.5" />
          <line x1="0" y1="-24" x2="0" y2="24" stroke={sparkColor} strokeWidth="2.5" />
          <line x1="-17" y1="-17" x2="17" y2="17" stroke={sparkColor} strokeWidth="2.5" />
          <line x1="-17" y1="17" x2="17" y2="-17" stroke={sparkColor} strokeWidth="2.5" />

          {/* Secondary 8 shorter rays */}
          <line x1="-11" y1="-5" x2="11" y2="5" stroke={sparkColor} strokeWidth="1.5" />
          <line x1="-5" y1="-11" x2="5" y2="11" stroke={sparkColor} strokeWidth="1.5" />
          <line x1="-11" y1="5" x2="11" y2="-5" stroke={sparkColor} strokeWidth="1.5" />
          <line x1="-5" y1="11" x2="5" y2="-11" stroke={sparkColor} strokeWidth="1.5" />

          {/* Core center hot spot */}
          <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};
