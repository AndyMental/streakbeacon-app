import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#27AE60"
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="3" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
