"use client";
import { useState } from 'react';

// Nota: En Next.js App Router, deberás envolver este layout con ClerkProvider
// y usar el hook useUser() para validar que publicMetadata.roles incluya 'admin'.

export default function AdminDashboard() {
  const [shipments, setShipments] = useState([
    { tracking_id: "TRK-COMPU-9999", external_seller_order_id: "sell_ord_888", status: "IN_TRANSIT" }
  ]);

  const updateStatus = async (trackingId: string, newStatus: string) => {
    // 1. Actualizar estado local
    setShipments(shipments.map(s => s.tracking_id === trackingId ? { ...s, status: newStatus } : s));
    
    // 2. Aquí llamarías a tu API Route interna (ej: /api/shipments/[id]/status)
    // Esa API Route se encargará de guardar en la DB (ShipmentEvent) y disparar los webhooks:
    // - A Payments App: POST /api/payments/:transaction_id/release (si es DELIVERED)
    // - A Buyer/Seller App: POST /api/.../shipping-webhook
    console.log(`Estado de ${trackingId} actualizado a ${newStatus}. Disparando webhooks...`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded shadow-lg p-6 border-t-8 border-[#fc7f40]">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel de Control Logístico (Admin)</h1>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="p-3 border-b">Tracking ID</th>
              <th className="p-3 border-b">Orden (Seller)</th>
              <th className="p-3 border-b">Estado Actual</th>
              <th className="p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map(shipment => (
              <tr key={shipment.tracking_id} className="hover:bg-gray-50">
                <td className="p-3 border-b font-mono text-sm">{shipment.tracking_id}</td>
                <td className="p-3 border-b text-sm">{shipment.external_seller_order_id}</td>
                <td className="p-3 border-b">
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                    shipment.status === 'IN_TRANSIT' ? 'bg-[#fc7f40]' : 'bg-[#0083bb]'
                  }`}>
                    {shipment.status}
                  </span>
                </td>
                <td className="p-3 border-b">
                  <select 
                    className="border text-sm p-1 rounded focus:outline-none"
                    value={shipment.status}
                    onChange={(e) => updateStatus(shipment.tracking_id, e.target.value)}
                  >
                    <option value="LABEL_CREATED">Label Created</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}