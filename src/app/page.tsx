"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = trackingId.trim();
    if (!trimmed) return;

    router.push(`/track/${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8 text-[#0083bb]">
        CompuLibre — Seguimiento Logístico
      </h1>

      <form
        onSubmit={handleSearch}
        className="w-full max-w-md bg-white p-6 rounded shadow-md"
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de Tracking
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="flex-1 border p-2 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-[#0083bb]"
            placeholder="Ej: TRK-COMPU-9120"
          />

          <button
            type="submit"
            className="bg-[#0083bb] text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!trackingId.trim()}
          >
            Buscar
          </button>
        </div>
      </form>
    </main>
  );
}