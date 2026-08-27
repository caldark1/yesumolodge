"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  rooms: { total: number; available: number; booked: number; maintenance: number; queen: { total: number; available: number }; deluxe: { total: number; available: number }; standard: { total: number; available: number } };
  bookings: { total: number; confirmed: number; pending: number; checkedIn: number };
  revenue: { total: number; thisMonth: number; online: number; walkIn: number };
  bookingSources: { online: number; walkIn: number };
  staffCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!stats) return <p className="text-slate">Failed to load dashboard data.</p>;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms", value: stats.rooms.total, sub: `${stats.rooms.available} available`, color: "bg-primary", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { label: "Booked Rooms", value: stats.rooms.booked, sub: `${stats.rooms.maintenance} maintenance`, color: "bg-accent", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { label: "Total Revenue", value: `GH₵ ${stats.revenue.total.toLocaleString()}`, sub: `GH₵ ${stats.revenue.thisMonth.toLocaleString()} this month`, color: "bg-success", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Active Bookings", value: stats.bookings.confirmed + stats.bookings.pending, sub: `${stats.bookings.confirmed} confirmed, ${stats.bookings.pending} pending`, color: "bg-primary-light", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm-18 3a2 2 0 11-4 0 2 2 0 014 0z" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-cream-dark p-5 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
              </svg>
            </div>
            <p className="text-2xl font-heading text-charcoal">{card.value}</p>
            <p className="text-sm text-slate mt-0.5">{card.label}</p>
            <p className="text-xs text-slate/70 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue by Source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-cream-dark p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="font-heading text-charcoal">Online Revenue</h3>
          </div>
          <p className="text-2xl font-heading text-primary">GH₵ {stats.revenue.online.toLocaleString()}</p>
          <p className="text-xs text-slate mt-1">{stats.bookingSources.online} online bookings</p>
        </div>
        <div className="bg-white rounded-xl border border-cream-dark p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 7a4 4 0 00-8 0m8 0v10m0 0h4m-4 0H8" />
              </svg>
            </div>
            <h3 className="font-heading text-charcoal">Walk-in Revenue</h3>
          </div>
          <p className="text-2xl font-heading text-accent">GH₵ {stats.revenue.walkIn.toLocaleString()}</p>
          <p className="text-xs text-slate mt-1">{stats.bookingSources.walkIn} walk-in bookings</p>
        </div>
      </div>

      {/* Room Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { name: "Queen Suite", data: stats.rooms.queen, price: 450 },
          { name: "Deluxe Room", data: stats.rooms.deluxe, price: 300 },
          { name: "Standard Room", data: stats.rooms.standard, price: 250 },
        ].map((cat) => (
          <div key={cat.name} className="bg-white rounded-xl border border-cream-dark p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-charcoal">{cat.name}</h3>
              <span className="text-xs text-slate">GH₵ {cat.price}/night</span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-heading text-primary">{cat.data.available}</span>
              <span className="text-slate text-sm mb-1">of {cat.data.total} available</span>
            </div>
            <div className="w-full h-2 bg-cream-dark rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(cat.data.available / cat.data.total) * 100}%` }} />
            </div>
            {cat.data.available === 0 && (
              <p className="text-xs text-danger font-medium mt-2">Fully Booked</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/dashboard/rooms", label: "Manage Rooms", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
          { href: "/dashboard/bookings", label: "View Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { href: "/dashboard/revenue", label: "Revenue Report", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { href: "/dashboard/reception", label: "Reception Desk", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.98.68l1.13 3.38a1 1 0 01-.17.91l-1.55 1.55a11.002 11.002 0 005.06 5.06l1.55-1.55a1 1 0 01.91-.17l3.38 1.13a1 1 0 01.68.98V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="bg-white rounded-xl border border-cream-dark p-4 hover:shadow-sm transition-all group">
            <svg className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
            </svg>
            <p className="text-sm font-medium text-charcoal">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
