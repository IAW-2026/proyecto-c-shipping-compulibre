"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShipmentStatus } from '@prisma/client';
import Image from "next/image";

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
  LABEL_CREATED: 'Envio creado',
  IN_TRANSIT:    'En tránsito',
  DELIVERED:     'Entregado',
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: '#485696',
  IN_TRANSIT:    '#FC7A1E',
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
      const res = await fetch(`/api/track/${encodeURIComponent(id.trim())}`);

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
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 text-center sm:text-left">
          <Image
            src="/compuLibre-logo.png"
            alt="CompuLibre Logo"
            width={128}
            height={128}
            className="rounded"
            priority
          />
    
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#485696]">
          CompuLibre - Seguimiento Logístico
        </h1>
      </div>

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
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Detalles del Paquete</h2>

          <div className="space-y-3 mb-6">
            <p><strong>Tracking:</strong> {shipment.trackingId}</p>
            <p><strong>Operador Logístico:</strong> {shipment.courier}</p>
            <p><strong>Origen:</strong> {shipment.originAddress}</p>
            <p><strong>Destino:</strong> {shipment.destinationAddress}</p>
          </div>

          {/* Status badge */}
          <div
            className="mb-6 p-4 rounded text-center font-bold text-lg text-white"
            style={{
              backgroundColor: STATUS_COLORS[shipment.status]
            }}
          >
            ESTADO: {STATUS_LABELS[shipment.status]}
          </div>

          {/* Tracking timeline */}
          {shipment.events.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Historial de seguimiento</h3>
              <ol className="relative border-l border-gray-200 ml-2">
                {[...shipment.events].reverse().map((ev, i) => (
                  <li key={ev.id} className="mb-4 ml-4">
                    <span
                      className="absolute -left-1.5 w-3 h-3 rounded-full border border-white"
                      style={{
                        backgroundColor: i === 0 ? STATUS_COLORS[ev.statusUpdate] : '#d1d5db',
                      }}
                    />
                    <p className="text-sm font-semibold text-gray-800">
                      {STATUS_LABELS[ev.statusUpdate]}
                    </p>
                    <p className="text-xs text-gray-500">{ev.location}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(ev.timestamp).toLocaleString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
  </main>
);
}
