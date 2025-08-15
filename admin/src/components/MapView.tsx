import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getEnv } from '../api/client';
import type { PathPoint } from '../api/types';

// Fix Leaflet's default icon paths under Vite
// @ts-expect-error - accessing private properties to override paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString()
});

type LatLon = { lat: number; lon: number };

function FitBounds({ current, dest, path }: { current?: LatLon; dest?: LatLon; path?: PathPoint[] }) {
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

export function MapView({ current, dest, path }: { current?: LatLon; dest?: LatLon; path?: PathPoint[] }) {
    const { mapTileUrl, mapAttribution } = getEnv();
    const center: [number, number] = current ? [current.lat, current.lon] : [0, 0];

    return (
        <div className="h-80 sm:h-96 lg:h-full min-h-[360px] rounded-md overflow-hidden border">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url={mapTileUrl} attribution={mapAttribution} />
                {current && (
                    <Marker position={[current.lat, current.lon]}>
                        <Popup>Current position</Popup>
                    </Marker>
                )}
                {dest && (
                    <Marker position={[dest.lat, dest.lon]}>
                        <Popup>Destination</Popup>
                    </Marker>
                )}
                {path && path.length > 1 && (
                    <Polyline positions={path.map((p) => [p.lat, p.lon])} color="#2563eb" />
                )}
                <FitBounds current={current} dest={dest} path={path} />
            </MapContainer>
        </div>
    );
}


