"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

      <form
        onSubmit={handleSearch}
        className="w-full max-w-md bg-[white] p-6 rounded shadow-md"
      >
        <label className="block text-sm font-medium text-[#F9C784] mb-2">
          Número de Tracking
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="flex-1 border p-2 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-[#F9C784]"
            placeholder="Ej: TRK-COMPU-9120"
          />

          <button
            type="submit"
            className="bg-[#FC7A1E] text-white px-4 py-2 rounded hover:bg-[#FC7A1E] disabled:opacity-50"
            disabled={!trackingId.trim()}
          >
            Buscar
          </button>
        </div>
      </form>
    </main>
  );
}