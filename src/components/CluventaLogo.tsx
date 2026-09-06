import React from 'react';

interface CluventaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'emblem';
  title?: string;
  tagline?: string;
  showTagline?: boolean;
  className?: string;
  glow?: boolean;
}

/**
 * Custom Stencil Futuristic "C" Icon Emblem
 */
export const CluventaEmblem: React.FC<{ size?: number; className?: string; glow?: boolean }> = ({
  size = 40,
  className = '',
  glow = true,
}) => {
  const sizeClass =
    size <= 24
      ? 'cluventa-emblem-size-xs'
      : size <= 32
      ? 'cluventa-emblem-size-sm'
      : size <= 44
      ? 'cluventa-emblem-size-md'
      : size <= 60
      ? 'cluventa-emblem-size-lg'
      : 'cluventa-emblem-size-xl';

  const filterId = `cipher-stencil-glow-${size}`;

  return (
    <div
      role="img"
      aria-label="CIPHER Emblem"
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${sizeClass} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={glow ? '3.5' : '1'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              {glow && <feMergeNode in="blur" />}
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={glow ? `url(#${filterId})` : undefined} fill="#00ff87">
          {/* Top Arch of Stencil C */}
          <path
            d="M 62 18 
               C 50 16 34 20 25 32 
               L 33 40 
               C 39 30 50 27 60 29 
               L 65 20 Z"
          />

          {/* Left Vertical Arch Segment of Stencil C */}
          <path
            d="M 18 42 
               C 17 48 17 52 18 58 
               L 28 56 
               C 27 52 27 48 28 44 Z"
          />

          {/* Bottom Arch of Stencil C */}
          <path
            d="M 25 68 
               C 34 80 50 84 62 82 
               L 65 73 
               C 50 75 39 72 33 62 
               L 25 68 Z"
          />

          {/* Bottom Mini Accent Bar & Dual Dots */}
          <rect x="18" y="88" width="34" height="4.5" rx="2.25" fill="#00ff87" />
          <circle cx="62" cy="90.25" r="3.25" fill="#00ff87" />
          <circle cx="74" cy="90.25" r="3.25" fill="#00ff87" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Full CIPHER Vector Wordmark & Stencil Typography
 */
export const CluventaLogo: React.FC<CluventaLogoProps> = ({
  size = 'md',
  variant = 'full',
  showTagline = true,
  className = '',
  glow = true,
}) => {
  const heights = {
    xs: 28,
    sm: 36,
    md: 46,
    lg: 60,
    xl: 82,
  }[size];

  if (variant === 'emblem') {
    return <CluventaEmblem size={heights} className={className} glow={glow} />;
  }

  const filterId = `cipher-wordmark-glow-${size}`;

  return (
    <div
      role="banner"
      aria-label="CIPHER - Smarter Investigations"
      className={`relative inline-flex items-center select-none ${className}`}
      style={{ height: heights }}
    >
      <svg
        viewBox="0 0 310 100"
        className="h-full w-auto overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glow ? '2.5' : '0.8'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              {glow && <feMergeNode in="blur" />}
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle Bottom Drop Shadow for tactile extruded depth */}
          <filter id="tactile-depth" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#011b0e" floodOpacity="0.9" />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          {/* =================================================================
              1. STENCIL WORDMARK: C i P H E R
              ================================================================= */}
          <g filter="url(#tactile-depth)" fill="#00ff87">
            {/* --- LETTER C --- */}
            {/* Top curved segment */}
            <path
              d="M 12 23.5
                 C 16 17.5 24 15 32 15.5
                 L 33 21
                 C 26.5 20.5 20.5 22.5 17.5 26.5
                 Z"
            />
            {/* Left vertical segment */}
            <path
              d="M 10 32
                 C 9.5 36 9.5 40 10 44
                 L 15.5 43.5
                 C 15 40 15 36 15.5 32.5
                 Z"
            />
            {/* Bottom curved segment */}
            <path
              d="M 17.5 49.5
                 C 20.5 53.5 26.5 55.5 33 55
                 L 32 60.5
                 C 24 61 16 58.5 12 52.5
                 Z"
            />

            {/* --- LETTER i --- */}
            {/* Lowercase-style sleek pillar */}
            <rect x="49" y="21.5" width="5.5" height="39" rx="1.5" />

            {/* --- LETTER P --- */}
            {/* Vertical stem */}
            <rect x="71" y="21.5" width="5.5" height="39" rx="1.5" />
            {/* Upper loop with open stencil notch */}
            <path
              d="M 76.5 21.5
                 L 93 21.5
                 C 98.5 21.5 102 25 102 30.5
                 C 102 36 98.5 39.5 93 39.5
                 L 76.5 39.5
                 L 76.5 34
                 L 92 34
                 C 94.5 34 96.5 32.5 96.5 30.5
                 C 96.5 28.5 94.5 27 92 27
                 L 76.5 27
                 Z"
            />

            {/* --- LETTER H --- */}
            {/* Left pillar */}
            <rect x="119" y="21.5" width="5.5" height="39" rx="1.5" />
            {/* Right pillar */}
            <rect x="142" y="21.5" width="5.5" height="39" rx="1.5" />
            {/* Center crossbar with stylish 3D folded notch */}
            <path
              d="M 124.5 38
                 L 137.5 38
                 L 137.5 43.5
                 L 124.5 43.5
                 Z"
            />
            <path
              d="M 120 40.5
                 L 124.5 38
                 L 124.5 43.5
                 Z"
              fill="#059669"
            />

            {/* --- LETTER E --- */}
            {/* Three distinct sleek horizontal trigram bars */}
            <rect x="160" y="21.5" width="24" height="5.5" rx="1.5" />
            <rect x="160" y="38" width="20" height="5.5" rx="1.5" />
            <rect x="160" y="55" width="24" height="5.5" rx="1.5" />

            {/* --- LETTER R --- */}
            {/* Upper curve and loop */}
            <path
              d="M 200 21.5
                 L 221 21.5
                 C 226.5 21.5 230 25 230 30.5
                 C 230 36 226.5 39.5 221 39.5
                 L 204.5 39.5
                 L 204.5 34
                 L 220 34
                 C 222.5 34 224.5 32.5 224.5 30.5
                 C 224.5 28.5 222.5 27 220 27
                 L 200 27
                 Z"
            />
            {/* Angular 45-degree diagonal leg */}
            <path
              d="M 209 37.5
                 L 214.5 37.5
                 L 226.5 55
                 L 231 55
                 L 231 60.5
                 L 222 60.5
                 Z"
            />
          </g>

          {/* =================================================================
              2. UNDERLINE ACCENT: SOLID BAR & TWO DOTS
              ================================================================= */}
          <g fill="#00ff87">
            {/* Solid Horizontal Accent Line */}
            <rect x="11" y="78" width="56" height="4.5" rx="2.25" />

            {/* Glowing Dot 1 */}
            <circle cx="79" cy="80.25" r="3.25" />

            {/* Glowing Dot 2 */}
            <circle cx="94" cy="80.25" r="3.25" />
          </g>

          {/* =================================================================
              3. STACKED SUB-TAGLINE: SMARTER / INVESTIGATIONS
              ================================================================= */}
          {variant === 'full' && showTagline && (
            <g fill="#00ff87">
              <text
                x="116"
                y="78"
                font-family="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif"
                font-size="9.5"
                font-weight="700"
                letter-spacing="0.28em"
                fill="#00ff87"
              >
                SMARTER
              </text>
              <text
                x="116"
                y="91"
                font-family="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif"
                font-size="9.5"
                font-weight="700"
                letter-spacing="0.28em"
                fill="#00ff87"
              >
                INVESTIGATIONS
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

// Aliases
export const CipherEmblem = CluventaEmblem;
export const CipherLogo = CluventaLogo;

export default CluventaLogo;
