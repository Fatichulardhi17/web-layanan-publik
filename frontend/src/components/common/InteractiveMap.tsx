import React, { useEffect, useRef } from 'react';
import type { Penduduk } from '../../types';

interface InteractiveMapProps {
  pendudukList: Penduduk[];
  selectedPenduduk?: Penduduk | null;
  onSelectPenduduk?: (p: Penduduk) => void;
  onPickCoordinates?: (lat: number, lng: number) => void;
  height?: string;
  isPickerMode?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  pendudukList,
  selectedPenduduk,
  onSelectPenduduk,
  onPickCoordinates,
  height = '420px',
  isPickerMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);

  // Default center of Sakalputung
  const defaultCenter: [number, number] = [-6.914600, 107.609600];

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    if (!L) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Handle map clicks in picker mode
      map.on('click', (e: any) => {
        if (onPickCoordinates) {
          const { lat, lng } = e.latlng;
          onPickCoordinates(Number(lat.toFixed(6)), Number(lng.toFixed(6)));

          if (pickerMarkerRef.current) {
            pickerMarkerRef.current.setLatLng(e.latlng);
          } else {
            const pickerIcon = L.divIcon({
              className: 'custom-picker-pin',
              html: `<div style="background-color: #118AB2; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 11px;">📍</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            });
            pickerMarkerRef.current = L.marker(e.latlng, { icon: pickerIcon }).addTo(map);
          }
        }
      });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when pendudukList or selectedPenduduk changes
  useEffect(() => {
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();

    pendudukList.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const isSelected = selectedPenduduk?.id === p.id;
      const markerColor = isSelected ? '#118AB2' : '#464B71';
      const borderColor = isSelected ? '#7CD5C7' : '#FFFFFF';

      const customIcon = L.divIcon({
        className: 'custom-resident-marker',
        html: `
          <div style="background: ${markerColor}; color: white; border: 2px solid ${borderColor}; border-radius: 12px; padding: 2px 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(70,75,113,0.3); white-space: nowrap;">
            <span>RT 0${p.rt}</span>: <span>${p.nama.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px; min-width: 180px;">
          <div style="font-size: 13px; font-weight: 700; color: #1F2232; margin-bottom: 2px;">${p.nama}</div>
          <div style="font-size: 11px; font-weight: 600; color: #118AB2; margin-bottom: 6px;">RT 0${p.rt} Sakalputung</div>
          <div style="font-size: 11px; color: #585C74; margin-bottom: 4px;"><strong>Alamat:</strong> ${p.alamatRumah}</div>
          <div style="font-size: 10px; color: #8B8FA3;"><strong>Koordinat:</strong> ${p.latitude}, ${p.longitude}</div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectPenduduk) {
          onSelectPenduduk(p);
        }
      });

      marker.addTo(layer);
    });

    // Pan to selected penduduk
    if (selectedPenduduk && selectedPenduduk.latitude && selectedPenduduk.longitude) {
      map.setView([selectedPenduduk.latitude, selectedPenduduk.longitude], 17, { animate: true });
    }
  }, [pendudukList, selectedPenduduk]);

  return (
    <div className="w-full relative rounded-[20px] overflow-hidden border border-[#E8E8E2] shadow-tactile bg-[#FFFFFF]">
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }}
        className="z-10"
      />
      {isPickerMode && (
        <div className="absolute top-3 left-3 z-20 bg-white/95 px-3 py-1.5 rounded-[12px] border border-[#E8E8E2] text-xs font-medium text-[#1F2232] shadow-sm">
          Klik pada peta untuk menentukan titik koordinat rumah
        </div>
      )}
    </div>
  );
};
