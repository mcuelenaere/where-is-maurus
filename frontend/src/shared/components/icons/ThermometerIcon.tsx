import React from "react";

export function ThermometerIcon({ className }: { className?: string }) {
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
      {/* Thermometer stem - rectangular body */}
      <rect x="10" y="3" width="4" height="12" rx="2" fill="none" />
      {/* Thermometer bulb at bottom */}
      <circle cx="12" cy="18" r="3.5" />
      {/* Mercury fill inside bulb */}
      <circle cx="12" cy="18" r="1.5" fill="currentColor" opacity="0.4" />
      {/* Scale marks on stem */}
      <path d="M12 6v2M12 9v2M12 12v2" strokeWidth="1" />
    </svg>
  );
}
