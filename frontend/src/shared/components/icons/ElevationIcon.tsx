import React from "react";

export function ElevationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mountain peaks - clearer design */}
      <path d="M3 20l5-5 4 4 5-5 5 5M3 20h18" />
      {/* Altitude indicator lines */}
      <path d="M12 6v14" strokeWidth="1.5" />
      <path d="M12 6l-3 3m3-3l3 3" strokeWidth="1.5" />
    </svg>
  );
}
