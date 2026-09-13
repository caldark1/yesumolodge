"use client";

import { useEffect, useState } from "react";

export default function ExtensionsQuickView() {
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/extensions');
        const data = await res.json();
        setExtensions(data.extensions || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      {loading ? <p className="text-sm text-slate">Loading...</p> : (
        <div className="space-y-2">
          {extensions.slice(0, 6).map((ext) => (
            <div key={ext.id} className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">
                <div className="font-medium">{ext.groupBookingId || ext.bookingId}</div>
                <div className="text-xs text-slate">{ext.extraNights} night(s) — GH₵ {ext.amount} — {ext.paymentStatus}</div>
              </div>
              <div className="text-xs text-slate">{new Date(ext.createdAt).toISOString().split('T')[0]}</div>
            </div>
          ))}
          {extensions.length === 0 && <p className="text-sm text-slate">No extensions found.</p>}
        </div>
      )}
    </div>
  );
}
