import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#050505" />
      <g fill="none" stroke="#D4AF37" strokeLinecap="round" strokeLinejoin="round">
        <path d="M139 364V236a117 117 0 0 1 234 0v128" strokeWidth="23" />
        <path d="M187 353V330a21 21 0 0 1 42 0v23M235 353V321a21 21 0 0 1 42 0v32M283 353V330a21 21 0 0 1 42 0v23" strokeWidth="6" />
      </g>
      <g fill="#D4AF37">
        <circle cx="208" cy="294" r="9" />
        <circle cx="256" cy="283" r="9" />
        <circle cx="304" cy="294" r="9" />
      </g>
    </svg>,
    size,
  );
}
