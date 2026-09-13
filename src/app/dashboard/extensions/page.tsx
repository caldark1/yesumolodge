"use client";

import { useEffect, useState } from "react";

export default function DashboardExtensionsPage() {
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExtensions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/extensions');
      const data = await res.json();
      setExtensions(data.extensions || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExtensions(); }, []);

  const markPaid = async (id: number) => {
    try {
      const res = await fetch('/api/extensions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'markPaid' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      fetchExtensions();
    } catch (e) { console.error(e); alert('Failed to mark paid'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-heading text-charcoal">Extensions</h2>
        <div className="ml-auto">
          <button onClick={fetchExtensions} className="px-3 py-1.5 bg-white border border-cream-dark rounded">Refresh</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-cream-dark overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-dark bg-cream/50">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Booking</th>
              <th className="text-left px-4 py-3">Old Checkout</th>
              <th className="text-left px-4 py-3">New Checkout</th>
              <th className="text-left px-4 py-3">Nights</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Note</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {extensions.map((ext) => (
              <tr key={ext.id} className="border-b border-cream-dark/50 hover:bg-cream/30">
                <td className="px-4 py-3 font-mono">{ext.id}</td>
                <td className="px-4 py-3">{ext.groupBookingId || ext.bookingId}</td>
                <td className="px-4 py-3">{new Date(ext.oldCheckOut).toISOString().split('T')[0]}</td>
                <td className="px-4 py-3">{new Date(ext.newCheckOut).toISOString().split('T')[0]}</td>
                <td className="px-4 py-3">{ext.extraNights}</td>
                <td className="px-4 py-3">GH₵ {ext.amount}</td>
                <td className="px-4 py-3">{ext.paymentStatus}</td>
                <td className="px-4 py-3">{ext.note || ''}</td>
                <td className="px-4 py-3">
                  {ext.paymentStatus !== 'paid' ? <button onClick={() => markPaid(ext.id)} className="px-3 py-1.5 bg-accent text-white rounded">Mark Paid</button> : <span className="text-xs text-success">Paid</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {extensions.length === 0 && !loading && <p className="text-center text-slate py-6">No extensions found.</p>}
      </div>
    </div>
  );
}
