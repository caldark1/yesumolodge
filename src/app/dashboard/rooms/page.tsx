"use client";

import { useState, useEffect } from "react";

interface Room {
  id: number;
  roomNumber: number;
  category: string;
  price: number;
  status: string;
  bedType: string;
  amenities: string[];
  description: string | null;
}

const categoryLabels: Record<string, string> = { queen: "Queen Suite", deluxe: "Deluxe", standard: "Standard" };

export default function DashboardRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/rooms?${params}`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, [filter]);

  const updateRoomStatus = async (roomId: number, status: string) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, status }),
      });
      if (res.ok) fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors: Record<string, string> = {
    available: "bg-success/10 text-success",
    booked: "bg-danger/10 text-danger",
    maintenance: "bg-warning/10 text-warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-heading text-charcoal">Room Management</h2>
        <div className="ml-auto flex gap-2">
          {["all", "available", "booked", "maintenance"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? "bg-primary text-white" : "bg-white border border-cream-dark text-slate hover:bg-cream-dark"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl border border-cream-dark p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-heading text-charcoal">Room {room.roomNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[room.status]}`}>
                {room.status}
              </span>
            </div>
            <p className="text-sm text-slate mb-1">{categoryLabels[room.category]} — {room.bedType}</p>
            <p className="text-sm font-medium text-charcoal mb-3">GH₵ {room.price}/night</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {room.amenities.slice(0, 3).map((a) => (
                <span key={a} className="text-[10px] px-1.5 py-0.5 bg-cream-dark rounded text-charcoal/60">{a}</span>
              ))}
            </div>

            <div className="flex gap-1.5">
              {room.status !== "available" && (
                <button onClick={() => updateRoomStatus(room.id, "available")} className="flex-1 text-xs px-2 py-1.5 bg-success/10 text-success rounded hover:bg-success/20 transition-colors">
                  Set Available
                </button>
              )}
              {room.status !== "booked" && (
                <button onClick={() => updateRoomStatus(room.id, "booked")} className="flex-1 text-xs px-2 py-1.5 bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors">
                  Set Booked
                </button>
              )}
              {room.status !== "maintenance" && (
                <button onClick={() => updateRoomStatus(room.id, "maintenance")} className="flex-1 text-xs px-2 py-1.5 bg-warning/10 text-warning rounded hover:bg-warning/20 transition-colors">
                  Maintenance
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && !loading && (
        <p className="text-center text-slate py-10">No rooms found.</p>
      )}
    </div>
  );
}
