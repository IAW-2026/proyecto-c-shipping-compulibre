"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShipmentStatus } from '@prisma/client';

interface ShipmentEvent {
  id: string;
  trackingId: string;
  statusUpdate: ShipmentStatus;
  location: string;
  timestamp: string;
}

interface Shipment {
  trackingId: string;
  externalSellerOrderId: string;
  courier: string;
  originAddress: string;
  destinationAddress: string;
  status: ShipmentStatus;
  labelUrl: string | null;
  createdAt: string;
  updatedAt: string;
  events: ShipmentEvent[];
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: 'Etiqueta creada',
  IN_TRANSIT:    'En tránsito',
  DELIVERED:     'Entregado',
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: '#0083bb',
  IN_TRANSIT:    '#fc7f40',
  DELIVERED:     '#10b981',
};

export default function TrackingPage() {
  const params   = useParams();
  const router   = useRouter();
  const urlId    = typeof params.trackingId === 'string' ? params.trackingId : '';

  const [trackingId, setTrackingId] = useState(urlId);
  const [shipment, setShipment]     = useState<Shipment | null>(null);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  // Auto-fetch when the page loads with a trackingId in the URL
  useEffect(() => {
    if (urlId) fetchShipment(urlId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  async function fetchShipment(id: string) {
    setLoading(true);
    setError('');
    setShipment(null);

    try {
      const res = await fetch(`/api/shipments/${encodeURIComponent(id.trim())}`);

      if (res.status === 404) {
        setError('Envío no encontrado. Verificá el número de tracking.');
        return;
      }
      if (!res.ok) {
        setError('Error del servidor. Intentá de nuevo más tarde.');
        return;
      }

      const data: Shipment = await res.json();
      setShipment(data);
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    // Push new URL — the useEffect above will trigger the fetch
    router.push(`/track/${encodeURIComponent(trackingId.trim())}`);
  };

  return (
  <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
    <h1 className="text-3xl font-bold mb-8 text-[#0083bb]">
      CompuLibre — Seguimiento Logístico
    </h1>

    {/* Error message */}
    {error && (
      <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 p-4 rounded shadow-sm mb-6">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    )}

    {/* Shipment details */}
    {shipment && (
      <div className="w-full max-w-md text-gray-700 bg-white p-6 rounded shadow-md border-l-4 border-[#0083bb]">
        ...
      </div>
    )}
  </main>
);
}
