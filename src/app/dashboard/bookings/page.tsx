"use client";

import { useState, useEffect } from "react";

interface BookingWithRoom {
  booking: {
    id: number;
    bookingId: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string | null;
    checkIn: string;
    checkOut: string;
    status: string;
    amount: number;
    paymentStatus: string;
    isGuest: boolean;
    source: string;
    createdAt: string | null;
  };
  room: {
    id: number;
    roomNumber: number;
    category: string;
    price: number;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-success/10 text-success",
  checked_in: "bg-primary/10 text-primary",
  checked_out: "bg-slate/10 text-slate",
  cancelled: "bg-danger/10 text-danger",
};

const paymentColors: Record<string, string> = {
  paid: "text-success",
  unpaid: "text-danger",
  refunded: "text-warning",
};

export default function DashboardBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.booking.bookingId.toLowerCase().includes(q) ||
      b.booking.guestName.toLowerCase().includes(q) ||
      b.booking.guestEmail.toLowerCase().includes(q) ||
      `room ${b.room.roomNumber}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-heading text-charcoal">All Bookings</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="px-3 py-1.5 rounded-lg border border-cream-dark bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-48"
          />
          {["all", "confirmed", "pending", "checked_in", "checked_out", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-primary text-white" : "bg-white border border-cream-dark text-slate hover:bg-cream-dark"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-dark bg-cream/50">
                <th className="text-left px-4 py-3 font-medium text-charcoal">Booking ID</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Room</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Check-in</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Check-out</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Source</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Status</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ booking, room }) => (
                <tr key={booking.id} className="border-b border-cream-dark/50 hover:bg-cream/30">
                  <td className="px-4 py-3 font-mono text-primary">{booking.bookingId}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-charcoal">{booking.guestName}</p>
                    <p className="text-xs text-slate">{booking.guestEmail}</p>
                  </td>
                  <td className="px-4 py-3">Room {room.roomNumber}</td>
                  <td className="px-4 py-3">{booking.checkIn}</td>
                  <td className="px-4 py-3">{booking.checkOut}</td>
                  <td className="px-4 py-3 font-medium">GH₵ {booking.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${booking.source === "walk_in" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                      {booking.source === "walk_in" ? "Walk-in" : "Online"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                      {booking.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${paymentColors[booking.paymentStatus]}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={booking.status}
                      onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-cream-dark bg-cream focus:ring-1 focus:ring-primary/20 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked_in">Checked In</option>
                      <option value="checked_out">Checked Out</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-slate py-10">No bookings found.</p>
        )}
      </div>
    </div>
  );
}
