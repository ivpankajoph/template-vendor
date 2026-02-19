"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

export default function MapComponent({ lat, long }: { lat: number; long: number }) {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg w-full h-[400px]">
      <MapContainer
        center={[lat, long]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, long]}>
          <Popup>Your store location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
