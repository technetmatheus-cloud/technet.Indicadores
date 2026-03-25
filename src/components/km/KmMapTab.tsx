import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import type { KmTecnica } from '@/types/database';

interface KmMapTabProps {
  data: KmTecnica[];
}

interface GeoPoint {
  lat: number;
  lng: number;
  endereco: string;
  tecnico: string;
  km: number;
}

const KmMapTab: React.FC<KmMapTabProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Geocode addresses using Nominatim
  useEffect(() => {
    const geocode = async () => {
      if (data.length === 0) return;
      setLoading(true);

      const uniqueAddresses = [...new Set(data.filter(d => d.endereco_destino).map(d => d.endereco_destino))];
      const geoCache = new Map<string, { lat: number; lng: number }>();
      const newPoints: GeoPoint[] = [];

      // Geocode unique addresses (limit to 50 to avoid rate limiting)
      const toGeocode = uniqueAddresses.slice(0, 50);
      for (const addr of toGeocode) {
        try {
          const cityName = data.find(d => d.endereco_destino === addr)?.cidade || '';
          const query = `${addr}, ${cityName}, Brasil`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'TechNET-Dashboard/1.0' }
          });
          const results = await res.json();
          if (results.length > 0) {
            geoCache.set(addr, { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          }
          // Small delay to respect Nominatim rate limit
          await new Promise(r => setTimeout(r, 300));
        } catch { /* skip */ }
      }

      for (const d of data) {
        const geo = geoCache.get(d.endereco_destino);
        if (geo) {
          newPoints.push({
            lat: geo.lat,
            lng: geo.lng,
            endereco: d.endereco_destino,
            tecnico: d.recurso,
            km: d.distancia_km,
          });
        }
      }

      setPoints(newPoints);
      setLoading(false);
    };

    geocode();
  }, [data]);

  // Initialize and update map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([-5.8, -35.2], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear old markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));

        points.forEach(p => {
          const marker = L.marker([p.lat, p.lng])
            .addTo(map)
            .bindPopup(`<strong>${p.tecnico}</strong><br/>${p.endereco}<br/>${p.km} km`);
          markersRef.current.push(marker);
        });

        map.fitBounds(bounds, { padding: [30, 30] });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Mapa de Rotas
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground ml-auto">{points.length} pontos mapeados</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full h-[400px] sm:h-[500px] rounded-lg border border-border z-0" />
      </CardContent>
    </Card>
  );
};

export default KmMapTab;