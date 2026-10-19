import React from "react";

interface XaivonLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Official XAIVON Geometric Brand Mark
 * Derived from canonical vector geometry on xaivon.com
 * Rendered in Architectural Warm Copper (#C4704B / #E59873)
 */
export function XaivonLogo({ className = "w-8 h-8", size, glow = true }: XaivonLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="XAIVON Logo"
      role="img"
    >
      <defs>
        <linearGradient id="xaivonCopperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4704B" />
          <stop offset="50%" stopColor="#D4805A" />
          <stop offset="100%" stopColor="#E59873" />
        </linearGradient>
        {glow && (
          <filter id="xaivonCopperGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      <g filter={glow ? "url(#xaivonCopperGlow)" : undefined}>
        {/* Main Left-to-Right diagonal bar */}
        <path d="M20 20 L40 20 L80 80 L60 80 Z" fill="url(#xaivonCopperGrad)" />

        {/* Right-to-Left diagonal upper segment */}
        <path
          d="M80 20 L65 20 L45 50 L60 50 Z"
          fill="url(#xaivonCopperGrad)"
          opacity="0.95"
        />

        {/* Right-to-Left diagonal lower segment */}
        <path
          d="M40 58 L25 80 L40 80 L55 58 Z"
          fill="url(#xaivonCopperGrad)"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}
