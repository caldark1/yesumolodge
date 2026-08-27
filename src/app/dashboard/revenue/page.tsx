"use client";

import { useState, useEffect } from "react";

interface RevenueData {
  totalRevenue: number;
  onlineRevenue: number;
  walkInRevenue: number;
  bookingCount: number;
  onlineCount: number;
  walkInCount: number;
  monthlyBreakdown: { month: string; revenue: number; onlineRevenue: number; walkInRevenue: number; bookings: number; onlineBookings: number; walkInBookings: number }[];
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState("month");

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (period === "custom" && startDate && endDate) { params.set("startDate", startDate); params.set("endDate", endDate); }
      else { params.set("period", period); }
      const res = await fetch(`/api/admin/revenue?${params}`);
      setData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRevenue(); }, [period, startDate, endDate]);

  const maxRevenue = Math.max(...(data?.monthlyBreakdown.map((m) => m.revenue) || [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-heading text-charcoal">Revenue Report</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          {["today", "month", "custom"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? "bg-primary text-white" : "bg-white border border-cream-dark text-slate hover:bg-cream-dark"}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <div className="bg-white rounded-xl border border-cream-dark p-4 flex gap-3 items-end">
          <div><label className="block text-xs text-slate mb-1">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none" /></div>
          <div><label className="block text-xs text-slate mb-1">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none" /></div>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-cream-dark p-5">
              <p className="text-sm text-slate">Total Revenue</p>
              <p className="text-2xl font-heading text-charcoal mt-1">GH₵ {data.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-cream-dark p-5">
              <p className="text-sm text-slate">Online Revenue</p>
              <p className="text-2xl font-heading text-primary mt-1">GH₵ {data.onlineRevenue.toLocaleString()}</p>
              <p className="text-xs text-slate mt-1">{data.onlineCount} bookings</p>
            </div>
            <div className="bg-white rounded-xl border border-cream-dark p-5">
              <p className="text-sm text-slate">Walk-in Revenue</p>
              <p className="text-2xl font-heading text-accent mt-1">GH₵ {data.walkInRevenue.toLocaleString()}</p>
              <p className="text-xs text-slate mt-1">{data.walkInCount} bookings</p>
            </div>
            <div className="bg-white rounded-xl border border-cream-dark p-5">
              <p className="text-sm text-slate">Avg per Booking</p>
              <p className="text-2xl font-heading text-charcoal mt-1">GH₵ {data.bookingCount > 0 ? Math.round(data.totalRevenue / data.bookingCount).toLocaleString() : 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-cream-dark p-6">
            <h3 className="font-heading text-charcoal mb-6">Monthly Revenue (Last 12 Months)</h3>
            <div className="space-y-3">
              {data.monthlyBreakdown.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate w-20 shrink-0">{m.month}</span>
                  <div className="flex-1 h-8 bg-cream-dark rounded overflow-hidden relative flex">
                    <div className="h-full bg-primary/70 rounded-l transition-all" style={{ width: `${(m.onlineRevenue / maxRevenue) * 100}%` }} title={`Online: GH₵ ${m.onlineRevenue}`} />
                    <div className="h-full bg-accent/70 rounded-r transition-all" style={{ width: `${(m.walkInRevenue / maxRevenue) * 100}%` }} title={`Walk-in: GH₵ ${m.walkInRevenue}`} />
                  </div>
                  <span className="text-xs font-medium text-charcoal w-28 text-right">GH₵ {m.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-cream-dark">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary/70 rounded" /><span className="text-xs text-slate">Online</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-accent/70 rounded" /><span className="text-xs text-slate">Walk-in</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
