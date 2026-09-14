import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
}

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris default
const DEFAULT_ZOOM = 13;

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
}) => {
  return (
    <div className="w-full h-full min-h-[400px]">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
};
