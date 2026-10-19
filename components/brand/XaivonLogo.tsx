import React from "react";

interface XaivonLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Exact Official XAIVON Geometric Brand Mark
 * Reconstructed 1:1 from xaivon.com visible navbar and footer (.premium-brand-mark):
 * - 28x28px rounded copper square (#B35734) with 8px corner radius
 * - 10x10px dark inset square (#24211D) with 2px corner radius at top:6px, left:6px
 * - 6x6px crisp light square (#FFFFFF) with 1px corner radius at right:6px, bottom:6px
 */
export function XaivonLogo({ className = "w-7 h-7", size, glow = false }: XaivonLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="XAIVON Brand Mark"
      role="img"
    >
      <defs>
        <linearGradient id="xaivonCopperBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4603B" />
          <stop offset="100%" stopColor="#B35734" />
        </linearGradient>
        {glow && (
          <filter id="xaivonMarkGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#B35734" floodOpacity="0.3" />
          </filter>
        )}
      </defs>

      <g filter={glow ? "url(#xaivonMarkGlow)" : undefined}>
        {/* Base Copper Rounded Square */}
        <rect width="28" height="28" rx="8" fill="url(#xaivonCopperBase)" />

        {/* Top-Left Dark Inset Square */}
        <rect x="6" y="6" width="10" height="10" rx="2" fill="#24211D" />

        {/* Bottom-Right White Inset Square */}
        <rect x="16" y="16" width="6" height="6" rx="1" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
