/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CluventaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'emblem';
  showTagline?: boolean;
  className?: string;
  glow?: boolean;
}

export const CluventaEmblem: React.FC<{ size?: number; className?: string; glow?: boolean }> = ({
  size = 40,
  className = '',
  glow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`emblem-glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={glow ? '4' : '1'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              {glow && <feMergeNode in="blur" />}
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#emblem-glow-${size})`}>
          {/* Outer 3D Hexagonal Prism C */}
          <path
            d="M 60 12 
               L 100 35 
               L 95 44 
               L 65 27 
               L 28 48 
               L 28 72 
               L 65 93 
               L 95 76 
               L 100 85 
               L 60 108 
               L 18 84 
               L 18 36 Z"
            fill="none"
            stroke="#00ff87"
            strokeWidth="3.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Inner 3D wireframe facet bevels */}
          <path
            d="M 60 12 L 50 24 L 28 37 M 100 35 L 88 44 M 60 108 L 50 96 L 28 83 M 100 85 L 88 76"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeOpacity="0.85"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Inner ridge completing the 3D C loop */}
          <path
            d="M 75 42 L 40 58 L 40 68 L 75 80"
            fill="none"
            stroke="#00ff87"
            strokeWidth="2.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Central 4-Point Sparkle Star */}
          <path
            d="M 60 42 Q 60 60 78 60 Q 60 60 60 78 Q 60 60 42 60 Q 60 60 60 42 Z"
            fill="#00ff87"
          />
          {/* Core White Highlight */}
          <circle cx="60" cy="60" r="2.2" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};

export const CluventaLogo: React.FC<CluventaLogoProps> = ({
  size = 'md',
  variant = 'full',
  showTagline = true,
  className = '',
  glow = true,
}) => {
  // Dimensions per size
  const config = {
    xs: { emblemSize: 24, textSize: 'text-sm', subSize: 'text-[7px]', gap: 'gap-2', track: 'tracking-[0.2em]' },
    sm: { emblemSize: 32, textSize: 'text-lg', subSize: 'text-[9px]', gap: 'gap-2.5', track: 'tracking-[0.24em]' },
    md: { emblemSize: 42, textSize: 'text-2xl', subSize: 'text-[10px]', gap: 'gap-3.5', track: 'tracking-[0.28em]' },
    lg: { emblemSize: 56, textSize: 'text-3xl', subSize: 'text-xs', gap: 'gap-4', track: 'tracking-[0.3em]' },
    xl: { emblemSize: 72, textSize: 'text-5xl', subSize: 'text-sm', gap: 'gap-5', track: 'tracking-[0.34em]' },
  }[size];

  if (variant === 'emblem') {
    return <CluventaEmblem size={config.emblemSize} className={className} glow={glow} />;
  }

  return (
    <div className={`inline-flex items-center ${config.gap} select-none ${className}`}>
      {/* Emblem Icon */}
      <CluventaEmblem size={config.emblemSize} glow={glow} />

      {/* Typography Block */}
      <div className="flex flex-col justify-center">
        {/* Main Brand Wordmark: CLUVENTΛ */}
        <div
          className={`${config.textSize} font-extrabold text-white font-sans leading-none tracking-[0.16em] flex items-center`}
        >
          <span>CLUVENT</span>
          {/* Stylized Lambda / Chevron A without horizontal crossbar */}
          <span className="inline-block relative">
            <svg
              viewBox="0 0 40 46"
              className="h-[0.88em] w-auto inline-block -mt-[0.05em] overflow-visible"
              fill="currentColor"
            >
              <path d="M 20 2 L 38 44 L 30 44 L 20 18 L 10 44 L 2 44 Z" />
            </svg>
          </span>
        </div>

        {/* Tagline: INSIGHTS • CONNECTIONS • ACTION */}
        {variant === 'full' && showTagline && (
          <div
            className={`${config.subSize} font-bold text-[#00ff87] font-sans ${config.track} uppercase mt-1 leading-tight flex items-center gap-1.5`}
            style={{
              textShadow: glow ? '0 0 10px rgba(0,255,135,0.45)' : 'none',
            }}
          >
            <span>INSIGHTS</span>
            <span className="text-emerald-400/80 text-[0.8em]">•</span>
            <span>CONNECTIONS</span>
            <span className="text-emerald-400/80 text-[0.8em]">•</span>
            <span>ACTION</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CluventaLogo;
