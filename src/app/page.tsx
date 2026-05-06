"use client";
import { useState } from 'react';

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // En producción, esto llamaría a tu API interna conectada a la base de datos
    // Ej: const res = await fetch(`/api/shipments/${trackingId}`);
    
    // Mock de datos para la UI
    if (trackingId === "TRK-COMPU-9999") {
      setShipment({
        tracking_id: "TRK-COMPU-9999",
        courier: "Andreani",
        status: "DELIVERED",
        destination_address: "Av. Siempreviva 742, Springfield"
      });
      setError('');
    } else {
      setError('Envío no encontrado');
      setShipment(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8 text-[#0083bb]">CompuLibre - Seguimiento Logístico</h1>
      
      <form onSubmit={handleSearch} className="w-full max-w-md bg-white p-6 rounded shadow-md mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Número de Tracking</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#0083bb]"
            placeholder="Ej: TRK-COMPU-9999"
          />
          <button type="submit" className="bg-[#0083bb] text-white px-4 py-2 rounded hover:bg-blue-700">
            Buscar
          </button>
        </div>
        {error && <p className="text-[#e6538a] mt-2 text-sm font-semibold">{error}</p>}
      </form>

      {shipment && (
        <div className="w-full max-w-md bg-white p-6 rounded shadow-md border-l-4 border-[#0083bb]">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Detalles del Paquete</h2>
          <div className="space-y-3">
            <p><strong>Tracking:</strong> {shipment.tracking_id}</p>
            <p><strong>Operador Logístico:</strong> {shipment.courier}</p>
            <p><strong>Destino:</strong> {shipment.destination_address}</p>
            
            <div className="mt-4 p-4 rounded text-center font-bold text-lg text-white" 
                 style={{
                   backgroundColor: shipment.status === 'DELIVERED' ? '#10b981' : 
                                    shipment.status === 'IN_TRANSIT' ? '#fc7f40' : '#0083bb',
                   backgroundImage: shipment.status === 'DELIVERED' ? 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)' : 'none',
                   backgroundSize: shipment.status === 'DELIVERED' ? '20px 20px' : 'auto',
                   color: shipment.status === 'DELIVERED' ? '#fff' : '#fff',
                   textShadow: shipment.status === 'DELIVERED' ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
                 }}>
              ESTADO: {shipment.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}