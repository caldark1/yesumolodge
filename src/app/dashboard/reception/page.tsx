"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Room {
  id: number;
  roomNumber: number;
  category: string;
  price: number;
  status: string;
  bedType: string;
  amenities: string[];
}

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
    source: string;
  };
  room: { id: number; roomNumber: number; category: string };
}

const categoryLabels: Record<string, string> = { queen: "Queen Suite", deluxe: "Deluxe", standard: "Standard" };

export default function ReceptionPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"available" | "booked" | "arrivals" | "departures" | "walkin">("available");

  // Walk-in booking form
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ guestName: "", guestPhone: "", roomId: "", numberOfDays: "1" });
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInError, setWalkInError] = useState("");
  const [walkInSuccess, setWalkInSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([fetch("/api/rooms"), fetch("/api/bookings")]);
      setRooms((await roomsRes.json()).rooms || []);
      setBookings((await bookingsRes.json()).bookings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const availableRooms = rooms.filter((r) => r.status === "available");
  const bookedRooms = rooms.filter((r) => r.status === "booked");
  const arrivals = bookings.filter((b) => b.booking.checkIn === today && b.booking.status === "confirmed");
  const departures = bookings.filter((b) => b.booking.checkOut === today && (b.booking.status === "confirmed" || b.booking.status === "checked_in"));

  const handleWalkInBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInLoading(true);
    setWalkInError("");
    setWalkInSuccess("");

    const selectedRoom = rooms.find((r) => r.id === parseInt(walkInForm.roomId));
    if (!selectedRoom) { setWalkInError("Please select a room"); setWalkInLoading(false); return; }

    const checkIn = today;
    const checkOut = format(new Date(new Date().getTime() + parseInt(walkInForm.numberOfDays) * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: parseInt(walkInForm.roomId),
          guestName: walkInForm.guestName,
          guestEmail: `walkin-${Date.now()}@williamsyesumo.com`,
          guestPhone: walkInForm.guestPhone,
          checkIn,
          checkOut,
          isGuest: true,
          source: "walk_in",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWalkInError(data.error || "Failed to create booking");
        return;
      }

      setWalkInSuccess(`Booking created! ID: ${data.booking.bookingId} — Room ${data.roomNumber} — GH₵ ${data.amount}`);
      setWalkInForm({ guestName: "", guestPhone: "", roomId: "", numberOfDays: "1" });
      fetchData(); // Refresh data
    } catch {
      setWalkInError("Failed to create booking");
    } finally {
      setWalkInLoading(false);
    }
  };

  const tabs = [
    { key: "available" as const, label: "Available Rooms", count: availableRooms.length },
    { key: "booked" as const, label: "Booked Rooms", count: bookedRooms.length },
    { key: "arrivals" as const, label: "Arrivals", count: arrivals.length },
    { key: "departures" as const, label: "Departures", count: departures.length },
    { key: "walkin" as const, label: "Walk-in Booking", count: 0 },
  ];

  const selectedRoomForWalkIn = rooms.find((r) => r.id === parseInt(walkInForm.roomId));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-heading text-charcoal">Reception Desk</h2>
        <button onClick={() => { setShowWalkIn(!showWalkIn); setTab("walkin"); }} className="ml-auto px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
          Walk-in Booking
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-cream-dark p-4"><p className="text-2xl font-heading text-success">{availableRooms.length}</p><p className="text-xs text-slate">Available Rooms</p></div>
        <div className="bg-white rounded-xl border border-cream-dark p-4"><p className="text-2xl font-heading text-danger">{bookedRooms.length}</p><p className="text-xs text-slate">Booked Rooms</p></div>
        <div className="bg-white rounded-xl border border-cream-dark p-4"><p className="text-2xl font-heading text-primary">{arrivals.length}</p><p className="text-xs text-slate">Today&apos;s Arrivals</p></div>
        <div className="bg-white rounded-xl border border-cream-dark p-4"><p className="text-2xl font-heading text-accent">{departures.length}</p><p className="text-xs text-slate">Today&apos;s Departures</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cream-dark overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-slate hover:text-charcoal"}`}>
            {t.label}{t.count > 0 ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {/* Walk-in Booking Form */}
      {tab === "walkin" && (
        <div className="bg-white rounded-xl border border-cream-dark p-6 animate-fade-in">
          <h3 className="font-heading text-charcoal text-lg mb-4">Walk-in Booking</h3>
          <p className="text-sm text-slate mb-4">Book a room for a walk-in guest. The room will be immediately marked as booked.</p>

          {walkInError && <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">{walkInError}</div>}
          {walkInSuccess && <div className="mb-4 p-3 bg-success/10 text-success text-sm rounded-lg">{walkInSuccess}</div>}

          <form onSubmit={handleWalkInBooking} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Guest Name *</label>
                <input type="text" value={walkInForm.guestName} onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Phone Number *</label>
                <input type="tel" value={walkInForm.guestPhone} onChange={(e) => setWalkInForm({ ...walkInForm, guestPhone: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="+233..." />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Select Available Room *</label>
                <select value={walkInForm.roomId} onChange={(e) => setWalkInForm({ ...walkInForm, roomId: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="">Choose a room...</option>
                  {availableRooms.sort((a, b) => a.roomNumber - b.roomNumber).map((r) => (
                    <option key={r.id} value={r.id}>Room {r.roomNumber} — {categoryLabels[r.category]} — GH₵ {r.price}/night</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Number of Days *</label>
                <input type="number" value={walkInForm.numberOfDays} onChange={(e) => setWalkInForm({ ...walkInForm, numberOfDays: e.target.value })} min="1" max="30" required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
            </div>

            {selectedRoomForWalkIn && (
              <div className="bg-cream rounded-lg p-4">
                <h4 className="font-medium text-charcoal text-sm mb-2">Booking Preview</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate">Room:</span><span>Room {selectedRoomForWalkIn.roomNumber} ({categoryLabels[selectedRoomForWalkIn.category]})</span>
                  <span className="text-slate">Check-in:</span><span>{today}</span>
                  <span className="text-slate">Check-out:</span><span>{format(new Date(new Date().getTime() + parseInt(walkInForm.numberOfDays) * 24 * 60 * 60 * 1000), "yyyy-MM-dd")}</span>
                  <span className="text-slate">Rate:</span><span>GH₵ {selectedRoomForWalkIn.price}/night</span>
                  <span className="text-slate font-medium">Total:</span><span className="font-medium text-primary text-lg">GH₵ {selectedRoomForWalkIn.price * parseInt(walkInForm.numberOfDays)}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={walkInLoading || !walkInForm.roomId || !walkInForm.guestName} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
              {walkInLoading ? "Creating Booking..." : "Create Walk-in Booking"}
            </button>
          </form>
        </div>
      )}

      {/* Available Rooms */}
      {tab === "available" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRooms.sort((a, b) => a.roomNumber - b.roomNumber).map((room) => (
            <div key={room.id} className="bg-white rounded-xl border border-cream-dark p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading text-charcoal">Room {room.roomNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Available</span>
              </div>
              <p className="text-sm text-slate">{categoryLabels[room.category]} — {room.bedType}</p>
              <p className="text-sm font-medium text-charcoal mt-1">GH₵ {room.price}/night</p>
            </div>
          ))}
        </div>
      )}

      {/* Booked Rooms */}
      {tab === "booked" && (
        <div className="space-y-3">
          {bookedRooms.map((room) => {
            const activeBooking = bookings.find((b) => b.room.id === room.id && (b.booking.status === "confirmed" || b.booking.status === "checked_in"));
            return (
              <div key={room.id} className="bg-white rounded-xl border border-cream-dark p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[150px]">
                  <span className="font-heading text-charcoal">Room {room.roomNumber}</span>
                  <p className="text-xs text-slate">{categoryLabels[room.category]}</p>
                </div>
                {activeBooking && (
                  <>
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-sm font-medium text-charcoal">{activeBooking.booking.guestName}</p>
                      <p className="text-xs text-slate">{activeBooking.booking.guestPhone || activeBooking.booking.guestEmail}</p>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-xs text-slate">In: {activeBooking.booking.checkIn} → Out: {activeBooking.booking.checkOut}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeBooking.booking.source === "walk_in" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                        {activeBooking.booking.source === "walk_in" ? "Walk-in" : "Online"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeBooking.booking.status === "checked_in" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {activeBooking.booking.status === "checked_in" ? "Checked In" : "Awaiting"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Arrivals */}
      {tab === "arrivals" && (
        <div className="space-y-3">
          {arrivals.length === 0 ? <p className="text-center text-slate py-10">No arrivals expected today.</p> :
            arrivals.map(({ booking, room }) => (
              <div key={booking.id} className="bg-white rounded-xl border border-cream-dark p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[120px]"><p className="font-medium text-charcoal">{booking.guestName}</p><p className="text-xs text-slate">{booking.guestPhone || booking.guestEmail}</p></div>
                <div className="flex-1 min-w-[100px]"><p className="text-sm">Room {room.roomNumber}</p><p className="text-xs text-slate">{categoryLabels[room.category]}</p></div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${booking.source === "walk_in" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>{booking.source === "walk_in" ? "Walk-in" : "Online"}</span>
                  <p className="text-sm font-medium">GH₵ {booking.amount}</p>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Departures */}
      {tab === "departures" && (
        <div className="space-y-3">
          {departures.length === 0 ? <p className="text-center text-slate py-10">No departures expected today.</p> :
            departures.map(({ booking, room }) => (
              <div key={booking.id} className="bg-white rounded-xl border border-cream-dark p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[120px]"><p className="font-medium text-charcoal">{booking.guestName}</p><p className="text-xs text-slate">{booking.guestPhone || booking.guestEmail}</p></div>
                <div className="flex-1 min-w-[100px]"><p className="text-sm">Room {room.roomNumber}</p><p className="text-xs text-slate">Checkout: {booking.checkOut}</p></div>
                <p className="text-sm font-medium text-accent">Ready for checkout</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
