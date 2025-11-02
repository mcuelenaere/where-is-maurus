import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo, useState, useRef } from "react";
import { Trans } from "@lingui/react/macro";

import { getEnv } from "../api/client";
import type { PathPoint } from "../api/types";

// Fix Leaflet's default icon paths under Vite
// @ts-expect-error - accessing private properties to override paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

type LatLon = { lat: number; lon: number; heading?: number };

type AutoFitMode = "car" | "route" | "off";

function TrackUserInteraction({
  onAutoFitDisable,
}: {
  onAutoFitDisable: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    // Listen to DOM events directly on the map container to catch user interactions
    const mapContainer = map.getContainer();
    const handleUserInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(".leaflet-control")) {
        // Don't disable if the interaction came from the control button
        return;
      }

      onAutoFitDisable();
    };

    // Listen to direct DOM events for user interaction
    mapContainer.addEventListener("mousedown", handleUserInteraction);
    mapContainer.addEventListener("touchstart", handleUserInteraction);
    mapContainer.addEventListener("wheel", handleUserInteraction);

    return () => {
      mapContainer.removeEventListener("mousedown", handleUserInteraction);
      mapContainer.removeEventListener("touchstart", handleUserInteraction);
      mapContainer.removeEventListener("wheel", handleUserInteraction);
    };
  }, [map, onAutoFitDisable]);

  return null;
}

function FitBounds({
  current,
  dest,
  autoFitMode,
}: {
  current?: LatLon;
  dest?: LatLon;
  autoFitMode: AutoFitMode;
}) {
  const map = useMap();

  useEffect(() => {
    // Don't auto-fit if auto-fit is off
    if (autoFitMode === "off") {
      return;
    }

    if (autoFitMode === "car") {
      // For "car" mode, only center on car with higher zoom
      if (current) {
        map.setView([current.lat, current.lon], 16, { animate: true });
      }
    } else if (autoFitMode === "route") {
      // For "route" mode, center on both car and destination
      const latlngs: L.LatLngTuple[] = [];
      if (current) latlngs.push([current.lat, current.lon]);
      if (dest) latlngs.push([dest.lat, dest.lon]);

      if (latlngs.length > 0) {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, current, dest, autoFitMode]);

  return null;
}

function AutoFitControl({
  autoFitMode,
  onCycleMode,
}: {
  autoFitMode: AutoFitMode;
  onCycleMode: () => void;
}) {
  const modeLabel = useMemo(() => {
    switch (autoFitMode) {
      case "car":
        return <Trans>Car</Trans>;
      case "route":
        return <Trans>Route</Trans>;
      case "off":
        return <Trans>Off</Trans>;
    }
  }, [autoFitMode]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCycleMode();
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={handleClick}
          className={`px-2 py-1.5 text-xs font-medium cursor-pointer ${autoFitMode !== "off"
            ? "bg-blue-50 dark:bg-blue-900"
            : "bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            } text-gray-700 dark:text-gray-300`}
          style={{
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: "1.2",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          <span className="text-[10px] leading-tight">
            <Trans>Automatically center</Trans>
          </span>
          <span className={`text-xs font-semibold ${autoFitMode !== "off" ? "text-blue-700 dark:text-blue-300" : ""} mt-0.5 flex items-center gap-1`}>
            {modeLabel}
          </span>
        </button>
      </div>
    </div>
  );
}

export function MapView({
  current,
  dest,
  path,
}: {
  current?: LatLon;
  dest?: LatLon;
  path?: PathPoint[];
}) {
  const [autoFitMode, setAutoFitMode] = useState<AutoFitMode>("route");
  const { mapTileUrl, mapAttribution, mapTileUrlDark, mapAttributionDark } = useMemo(() => getEnv(), []);

  // Listen for dark mode preference changes
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const url = prefersDark ? mapTileUrlDark : mapTileUrl;
  const attribution = prefersDark ? mapAttributionDark : mapAttribution;

  const center: [number, number] = useMemo(
    () => (current ? [current.lat, current.lon] : [0, 0]),
    [current?.lat, current?.lon]
  );

  const pathPositions = useMemo(() => {
    if (!path || path.length < 2) return undefined;
    return path.map((p) => [p.lat, p.lon] as [number, number]);
  }, [path]);

  const carIcon = useMemo(() => {
    return L.divIcon({
      className: "",
      html: `
      <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        style="transform: rotate(${current?.heading ?? 0}deg); transform-origin: 50% 50%;">
        <g>
          <path d="M12 2 L18 14 L12 12 L6 14 Z" fill="#2563eb" stroke="#1e40af" stroke-width="1" />
        </g>
      </svg>
    `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, [current?.heading]);

  const destIcon = useMemo(() => {
    return L.divIcon({
      className: "",
      html: `
      <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M12 2 C8 2 6 4 6 7 C6 10 12 16 12 16 C12 16 18 10 18 7 C18 4 16 2 12 2 Z" fill="#ef4444" stroke="#991b1b" stroke-width="1" />
          <circle cx="12" cy="7" r="2" fill="#fff" />
        </g>
      </svg>
    `,
      iconSize: [28, 28],
      iconAnchor: [14, 16],
    });
  }, []);

  return (
    <div className="h-80 min-h-[360px] overflow-hidden rounded-md border border-gray-200 sm:h-96 lg:h-full dark:border-gray-700 dark:bg-gray-800">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={url} attribution={attribution} />
        {current && (
          <Marker position={[current.lat, current.lon]} icon={carIcon}>
            <Popup>
              <Trans>Current position</Trans>
            </Popup>
          </Marker>
        )}
        {dest && (
          <Marker position={[dest.lat, dest.lon]} icon={destIcon}>
            <Popup>
              <Trans>Destination</Trans>
            </Popup>
          </Marker>
        )}
        {pathPositions && (
          <Polyline
            positions={pathPositions}
            color="#2563eb"
            weight={3}
            opacity={0.8}
          />
        )}
        <TrackUserInteraction
          onAutoFitDisable={() => setAutoFitMode("off")}
        />
        <FitBounds
          current={current}
          dest={dest}
          autoFitMode={autoFitMode}
        />
        <AutoFitControl
          autoFitMode={autoFitMode}
          onCycleMode={() => {
            // Cycle between route and car (prefer car first)
            if (autoFitMode === "car") {
              setAutoFitMode("route");
            } else {
              setAutoFitMode("car");
            }
          }}
        />
      </MapContainer>
    </div>
  );
}
