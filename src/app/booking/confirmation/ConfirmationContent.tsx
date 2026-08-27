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

  useEffect(() => {
    if (!referenceParam) {
      setStatus("failed");
      return;
    }
    checkPayment();
  }, [referenceParam]);

  const checkPayment = async () => {
    try {
      const ref = referenceParam;

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
