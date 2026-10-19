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
          background: "transparent",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="28" height="28" rx="8" fill="#B35734" />
          <rect x="6" y="6" width="10" height="10" rx="2" fill="#24211D" />
          <rect x="16" y="16" width="6" height="6" rx="1" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
