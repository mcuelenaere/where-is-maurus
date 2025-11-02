import React from "react";

function getTemperatureFillColor(temperature?: number): string {
  if (temperature === undefined || temperature === null) {
    return "fill-gray-400 dark:fill-gray-500";
  }

  if (temperature < 0) {
    return "fill-blue-800 dark:fill-blue-900";
  } else if (temperature < 10) {
    return "fill-blue-500 dark:fill-blue-600";
  } else if (temperature < 15) {
    return "fill-blue-300 dark:fill-blue-400";
  } else if (temperature < 25) {
    return "fill-green-500 dark:fill-green-600";
  } else if (temperature < 30) {
    return "fill-orange-500 dark:fill-orange-400";
  } else {
    return "fill-red-500 dark:fill-red-400";
  }
}

function calculateStemFill(temperature?: number): { height: number; y: number } | null {
  if (temperature === undefined || temperature === null) {
    return null;
  }

  // Temperature range: -10°C to 40°C, mapped to stem height
  const minTemp = -10;
  const maxTemp = 40;
  const stemTop = 3;
  const bulbCenterY = 22;
  const bulbRadius = 3.5;
  // Stem extends down to where it smoothly transitions into bulb
  const stemBottom = bulbCenterY - bulbRadius; // 22 - 3.5 = 18.5
  const stemHeight = stemBottom - stemTop; // 18.5 - 3 = 15.5

  // Clamp temperature to range
  const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature));

  // Calculate fill height (0 at minTemp, stemHeight at maxTemp)
  const fillHeight = ((clampedTemp - minTemp) / (maxTemp - minTemp)) * stemHeight;

  // Fill starts from bottom (where stem meets bulb) and goes up
  const fillY = stemBottom - fillHeight;

  return {
    height: Math.max(0, fillHeight),
    y: fillY,
  };
}

export function ThermometerIcon({
  className,
  temperature,
}: {
  className?: string;
  temperature?: number;
}) {
  const fillColorClass = getTemperatureFillColor(temperature);
  const strokeColorClass = "text-gray-600 dark:text-gray-300";
  const combinedClassName = className ? `${className} ${strokeColorClass}` : strokeColorClass;

  const stemFill = calculateStemFill(temperature);

  const stemX = 10;
  const stemWidth = 4;
  const stemTop = 3;
  const bulbCenterY = 22;
  const bulbRadius = 3.5;
  const stemBottom = bulbCenterY - bulbRadius; // 18.5
  const stemHeight = stemBottom - stemTop; // 15.5

  // Create smooth unified path (like reference SVG)
  // Following reference pattern: M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z
  // Start top-right, go down right side, arc for bulb bottom, back up left side, small rounded top
  const rightX = stemX + stemWidth; // 14
  const leftX = stemX; // 10

  // Unified path: rectangle top, smooth arc transition to bulb bottom
  // The arc goes from right bottom corner of stem, curves down to form bulb, back to left bottom corner
  const thermometerPath = `M ${rightX} ${stemTop} v ${stemHeight} a ${bulbRadius} ${bulbRadius} 0 1 1 -${stemWidth} 0 V ${stemTop} a 2 2 0 0 1 ${stemWidth} 0 Z`;

  return (
    <svg
      className={combinedClassName}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 28"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mercury fill in stem - starts from bottom where stem meets bulb */}
      {stemFill && stemFill.height > 0 && (
        <rect
          x={stemX}
          y={stemFill.y}
          width={stemWidth}
          height={stemFill.height}
          rx="2"
          className={fillColorClass}
          strokeWidth="0"
        />
      )}

      {/* Mercury fill inside bulb */}
      {temperature !== undefined && temperature !== null && (
        <>
          <rect
            x={stemX}
            y={bulbCenterY - bulbRadius * 2}
            width={stemWidth}
            height={bulbRadius * 2}
            rx="2"
            className={fillColorClass}
            strokeWidth="0"
          />
          <circle
            cx="12"
            cy={bulbCenterY}
            r={bulbRadius}
            className={fillColorClass}
            strokeWidth="0"
          />
        </>
      )}

      {/* Scale marks on stem */}
      <path d="M12 6v1.5M12 9v1.5M12 12v1.5M12 15v1.5M12 18v1.5" strokeWidth="1" />

      {/* Thermometer outline - unified path with smooth stem-to-bulb transition */}
      <path d={thermometerPath} />
    </svg>
  );
}
