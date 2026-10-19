import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * XAIVON Architectural Favicon Generator
 * Produces crisp 32x32 icon with geometric copper brand geometry
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0B0E14",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "7px",
          border: "1px solid rgba(196, 112, 75, 0.4)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 20 L40 20 L80 80 L60 80 Z" fill="#C4704B" />
          <path d="M80 20 L65 20 L45 50 L60 50 Z" fill="#D4805A" opacity="0.95" />
          <path d="M40 58 L25 80 L40 80 L55 58 Z" fill="#E59873" opacity="0.9" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
