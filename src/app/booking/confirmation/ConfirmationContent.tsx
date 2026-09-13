"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const referenceParam = searchParams.get("reference") || searchParams.get("ref") || searchParams.get("reference_id");
  const [status, setStatus] = useState<"checking" | "success" | "pending" | "failed">("checking");
  const [details, setDetails] = useState<Record<string, unknown>>({});
  const [booking, setBooking] = useState<any | null>(null);
  const [newCheckOut, setNewCheckOut] = useState<string>("");
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState<string | null>(null);
  const [extensionCreated, setExtensionCreated] = useState<any | null>(null);
  const [extPayRef, setExtPayRef] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceParam) {
      setStatus("failed");
      return;
    }
    checkPayment();
    // Also try to load booking record for this reference to enable extension actions
    (async () => {
      try {
        const res = await fetch('/api/bookings');
        const data = await res.json();
        const found = data.bookings?.find((b: any) => (b.booking.bookingId === referenceParam || b.booking.groupBookingId === referenceParam));
        if (found) setBooking(found.booking);
      } catch (e) {
        // ignore
      }
    })();
  }, [referenceParam]);

  const checkPayment = async () => {
    try {
      if (!referenceParam) return;
      const ref = referenceParam as string;

      // Always attempt server-side verification using the provided reference param.
      // The verify endpoint will resolve booking codes to paystack references when needed.
      const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setStatus("success");
        setDetails(data);
        return;
      }

      // If verify didn't return success, try to look up booking by code and its stored paystackReference
      const bookingsRes = await fetch("/api/bookings");
      const bookingsData = await bookingsRes.json();
      const booking = bookingsData.bookings?.find(
        (b: { booking: { bookingId: string; paymentStatus: string; paystackReference?: string } }) => b.booking.bookingId === ref
      );

      if (booking?.booking.paymentStatus === "paid") {
        setStatus("success");
        setDetails(booking.booking);
        return;
      }

      const paystackRef = booking?.booking.paystackReference;
      if (paystackRef) {
        const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(paystackRef)}`);
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.status === "success") {
          setStatus("success");
          setDetails(verifyData);
          return;
        }
      }

      setStatus("pending");
    } catch (err) {
      console.error("Confirmation checkPayment error:", err);
      setStatus("pending");
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      <section className="pt-28 pb-10">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-cream-dark text-center">
            {status === "checking" && (
              <>
                <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-heading text-charcoal mb-2">Verifying Payment</h2>
                <p className="text-slate text-sm">Please wait while we confirm your payment...</p>
              </>
            )}
            {status === "success" && (
              <>
                <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-heading text-charcoal mb-2">Payment Confirmed!</h2>
                <p className="text-slate text-sm mb-4">Your booking has been confirmed.</p>
                <div className="bg-cream rounded-lg p-4 mb-6">
                  <p className="text-xs text-slate">Booking Reference</p>
                  <p className="text-lg font-heading text-primary">{referenceParam}</p>
                </div>
              </>
            )}
            {status === "pending" && (
              <>
                <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-heading text-charcoal mb-2">Payment Pending</h2>
                <p className="text-slate text-sm mb-4">Your booking has been created but payment is still pending.</p>
                <div className="bg-cream rounded-lg p-4 mb-6">
                  <p className="text-xs text-slate">Booking Reference</p>
                  <p className="text-lg font-heading text-primary">{referenceParam}</p>
                </div>
                <button onClick={checkPayment} className="px-6 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">Check Again</button>
              </>
            )}
            {/* Extension UI */}
            {booking && (
              <div className="mt-6 text-left">
                <h3 className="text-sm font-medium text-charcoal mb-2">Extend Your Stay</h3>
                <p className="text-xs text-slate mb-2">Select a new check-out date to extend your stay. The extra nights will be calculated and payable.</p>
                <div className="flex gap-2 mb-2">
                  <input type="date" value={newCheckOut} onChange={(e) => setNewCheckOut(e.target.value)} min={new Date().toISOString().split('T')[0]} className="px-3 py-2 rounded-lg border border-cream-dark" />
                  <button onClick={async () => {
                    if (!newCheckOut) { setExtError('Please select a new check-out date'); return; }
                    setExtLoading(true); setExtError(null);
                    try {
                      const res = await fetch('/api/extensions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: booking.id, newCheckOut }) });
                      const data = await res.json();
                      if (!res.ok) { setExtError(data.error || 'Failed to create extension'); setExtLoading(false); return; }
                      setExtensionCreated(data.extension);
                      setExtLoading(false);
                    } catch (e) { setExtError('Failed to create extension'); setExtLoading(false); }
                  }} className="px-4 py-2 bg-primary text-white rounded-lg">Create Extension</button>
                </div>
                {extError && <p className="text-xs text-danger mb-2">{extError}</p>}
                {extensionCreated && (
                  <div className="bg-cream rounded-lg p-3 mb-2">
                    <div className="flex justify-between text-sm"><span>Extra Nights</span><span>{extensionCreated.extraNights}</span></div>
                    <div className="flex justify-between text-sm"><span>Amount</span><span className="font-medium">GH₵ {extensionCreated.amount}</span></div>
                    <div className="mt-3">
                      <button onClick={async () => {
                        // initialize payment for extension
                        try {
                          setExtLoading(true);
                          const res = await fetch('/api/payments/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ extensionId: extensionCreated.id }) });
                          const data = await res.json();
                          if (!res.ok) { setExtError(data.error || 'Failed to initialize payment'); setExtLoading(false); return; }
                          setExtPayRef(data.reference);
                          // redirect to Paystack if authorization url present
                          if (data.authorizationUrl) window.location.href = data.authorizationUrl;
                          setExtLoading(false);
                        } catch (e) { setExtError('Failed to initialize extension payment'); setExtLoading(false); }
                      }} className="px-4 py-2 bg-accent text-white rounded-lg">Pay GH₵ {extensionCreated.amount}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {status === "failed" && (
              <>
                <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-heading text-charcoal mb-2">Verification Issue</h2>
                <p className="text-slate text-sm">We couldn&apos;t verify your payment. Please contact us.</p>
              </>
            )}
            <Link href="/" className="inline-block mt-4 text-sm text-primary hover:text-primary-dark">Return to Home</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
