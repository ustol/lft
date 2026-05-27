"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon paths (broken by webpack asset handling)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ClickHandlerProps {
  onPick: (lat: number, lng: number) => void;
}
function ClickHandler({ onPick }: ClickHandlerProps) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface LocationPickerMapProps {
  center: [number, number];
  zoom: number;
  marker: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}

export function LocationPickerMap({ center, zoom, marker, onPick }: LocationPickerMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "260px", width: "100%", borderRadius: "0.75rem" }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {marker && <Marker position={marker} />}
      <ClickHandler onPick={onPick} />
    </MapContainer>
  );
}
