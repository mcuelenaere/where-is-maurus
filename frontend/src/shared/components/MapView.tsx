import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

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

function FitBounds({
  current,
  dest,
  path,
}: {
  current?: LatLon;
  dest?: LatLon;
  path?: PathPoint[];
}) {
  const map = useMap();
  if (!current && !dest && !(path && path.length)) return null;
  const latlngs: L.LatLngExpression[] = [];
  if (current) latlngs.push([current.lat, current.lon]);
  if (dest) latlngs.push([dest.lat, dest.lon]);
  if (path && path.length) latlngs.push(...path.map((p) => [p.lat, p.lon] as [number, number]));
  const bounds = L.latLngBounds(latlngs as L.LatLngTuple[]);
  map.fitBounds(bounds, { padding: [20, 20] });
  return null;
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
  const { mapTileUrl, mapAttribution, mapTileUrlDark, mapAttributionDark } = getEnv();
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const url = prefersDark ? mapTileUrlDark : mapTileUrl;
  const attribution = prefersDark ? mapAttributionDark : mapAttribution;
  const center: [number, number] = current ? [current.lat, current.lon] : [0, 0];
  const carIcon = L.divIcon({
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
  const destIcon = L.divIcon({
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

  return (
    <div className="h-80 min-h-[360px] overflow-hidden rounded-md border border-gray-200 sm:h-96 lg:h-full dark:border-gray-700 dark:bg-gray-800">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={url} attribution={attribution} />
        {current && (
          <Marker position={[current.lat, current.lon]} icon={carIcon}>
            <Popup>Current position</Popup>
          </Marker>
        )}
        {dest && (
          <Marker position={[dest.lat, dest.lon]} icon={destIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}
        {path && path.length > 1 && (
          <Polyline
            positions={path.map((p) => [p.lat, p.lon])}
            color="#2563eb"
            weight={3}
            opacity={0.8}
          />
        )}
        <FitBounds current={current} dest={dest} path={path} />
      </MapContainer>
    </div>
  );
}
