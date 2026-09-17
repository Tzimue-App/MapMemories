import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PinItem, DEFAULT_PIN_RADIUS, DEFAULT_PIN_COLOR } from '../../types/pin';
import { PinConfigPanel } from './PinConfigPanel';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  initialPins?: PinItem[];
  onPinsChange?: (pins: PinItem[]) => void;
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

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const createCustomPinIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); margin-top: -12px; margin-left: -12px;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

export const MapView: React.FC<MapViewProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  initialPins = [],
  onPinsChange,
}) => {
  const [pins, setPins] = useState<PinItem[]>(initialPins);

  useEffect(() => {
    if (initialPins && initialPins.length > 0) {
      setPins(initialPins);
    }
  }, [initialPins]);

  const updatePins = (newPins: PinItem[]) => {
    setPins(newPins);
    if (onPinsChange) {
      onPinsChange(newPins);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    const newPin: PinItem = {
      id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      lat,
      lng,
      radiusMeters: DEFAULT_PIN_RADIUS,
      color: DEFAULT_PIN_COLOR,
    };
    updatePins([...pins, newPin]);
  };

  const handlePinMove = (id: string, lat: number, lng: number) => {
    const updated = pins.map((p) => (p.id === id ? { ...p, lat, lng } : p));
    updatePins(updated);
  };

  const handleRadiusChange = (id: string, radiusMeters: number) => {
    const updated = pins.map((p) =>
      p.id === id
        ? { ...p, radiusMeters, radiusDisabled: radiusMeters === 0 }
        : p
    );
    updatePins(updated);
  };

  const handleColorChange = (id: string, color: string) => {
    const updated = pins.map((p) => (p.id === id ? { ...p, color } : p));
    updatePins(updated);
  };

  const handleDeletePin = (id: string) => {
    const updated = pins.filter((p) => p.id !== id);
    updatePins(updated);
  };

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
        <MapClickHandler onMapClick={handleMapClick} />

        {pins.map((pin) => {
          const showCircle = pin.radiusMeters > 0 && !pin.radiusDisabled;

          return (
            <React.Fragment key={pin.id}>
              <Marker
                position={[pin.lat, pin.lng]}
                icon={createCustomPinIcon(pin.color)}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    handlePinMove(pin.id, position.lat, position.lng);
                  },
                }}
              >
                <Popup className="pin-config-popup" offset={[0, -10]}>
                  <PinConfigPanel
                    pin={pin}
                    onRadiusChange={(radius) => handleRadiusChange(pin.id, radius)}
                    onColorChange={(color) => handleColorChange(pin.id, color)}
                    onDelete={() => handleDeletePin(pin.id)}
                  />
                </Popup>
              </Marker>

              {showCircle && (
                <Circle
                  center={[pin.lat, pin.lng]}
                  radius={pin.radiusMeters}
                  pathOptions={{
                    color: pin.color,
                    fillColor: pin.color,
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
