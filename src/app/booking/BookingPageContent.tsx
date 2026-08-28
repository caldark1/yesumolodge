"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface CategoryInfo {
  category: string;
  price: number;
  bedType: string;
  amenities: string[];
  description: string | null;
  totalRooms: number;
  availableRooms: number;
  bookedRooms: number;
  maintenanceRooms: number;
  fullyBooked: boolean;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const categoryLabels: Record<string, { name: string; desc: string }> = {
  queen: { name: "Queen Suite", desc: "Premium room with queen-sized bed" },
  deluxe: { name: "Deluxe Room", desc: "Spacious room with double bed" },
  standard: { name: "Standard Room", desc: "Comfortable room with double bed" },
};

export default function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [bookingResult, setBookingResult] = useState<{ bookingId: string; id?: number; paystackReference?: string; accessCode?: string; amount: number; nights: number; roomNumber: number; category: string } | null>(null);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);

    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setGuestName(`${data.user.firstName} ${data.user.lastName}`);
          setGuestEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const fetchCategories = async () => {
    if (!checkIn || !checkOut) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: "categories", checkIn, checkOut });
      const res = await fetch(`/api/rooms?${params}`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkIn && checkOut) fetchCategories();
  }, [checkIn, checkOut]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => {
    if (!phone) return true; // optional
    const digits = phone.replace(/\s+/g, "");
    return /^\+?[0-9]{7,15}$/.test(digits);
  };
  const isValidName = (name: string) => name.trim().length > 1 && !/\d/.test(name);

  const nights =
    checkIn && checkOut
      ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  const selectedCatData = categories.find((c) => c.category === selectedCategory);
  const total = selectedCatData ? selectedCatData.price * nights : 0;

  const handleCreateBooking = async () => {
    if (!selectedCategory || !checkIn || !checkOut) return;
    if (!guestName || !guestEmail) {
      setError("Guest name and email are required");
      return;
    }

    // Client-side validation
    if (!isValidName(guestName)) {
      setError("Please enter a valid name (no numbers)");
      return;
    }
    if (!isValidEmail(guestEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!isValidPhone(guestPhone)) {
      setError("Please enter a valid phone number (digits, optional leading +)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          guestName,
          guestEmail,
          guestPhone,
          checkIn,
          checkOut,
          userId: user?.id || null,
          isGuest: !user,
          source: "online",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create booking");
        return;
      }

      setBookingResult({
        bookingId: data.booking.bookingId,
        id: data.booking.id,
        amount: data.amount,
        nights: data.nights,
        roomNumber: data.roomNumber,
        category: data.category,
      });
      setStep(4);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingResult) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingResult.id ?? bookingResult.bookingId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to initialize payment");
        return;
      }

      // store reference/access code so frontend can call verify later
      setBookingResult((prev) => (prev ? { ...prev, paystackReference: data.reference, accessCode: data.access_code || data.accessCode } : prev));

      const win = window as unknown as Record<string, unknown>;
      if (typeof window !== "undefined" && win.PaystackPop) {
        const Popup = win.PaystackPop as new () => { resumeTransaction: (code: string) => void };
        const popup = new Popup();
        popup.resumeTransaction(data.access_code || data.accessCode);
      } else if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      setError("Payment initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <section className="pt-28 pb-8 bg-gradient-to-br from-charcoal to-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-accent text-sm tracking-[0.2em] uppercase mb-2">Reservation</p>
          <h1 className="text-4xl font-heading text-white">Book Your Stay</h1>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["Select Dates", "Choose Room", "Guest Details", "Payment"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > i + 1 ? "bg-success text-white" : step === i + 1 ? "bg-primary text-white" : "bg-cream-dark text-slate"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`hidden sm:inline text-xs ${step === i + 1 ? "text-charcoal font-medium" : "text-slate"}`}>{label}</span>
                {i < 3 && <div className="w-6 h-px bg-cream-dark" />}
              </div>
            ))}
          </div>

          {error && <div className="mb-6 p-4 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}

          {/* Step 1: Dates */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-cream-dark animate-fade-in">
              <h2 className="text-xl font-heading text-charcoal mb-6">Select Your Dates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Check-in Date</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Check-out Date</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>
              {nights > 0 && <p className="text-sm text-slate mb-6">{nights} night{nights > 1 ? "s" : ""} selected</p>}
              <button onClick={() => { if (checkIn && checkOut && nights > 0) setStep(2); else setError("Please select valid dates"); }} disabled={!checkIn || !checkOut || nights < 1} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                Find Available Rooms
              </button>
            </div>
          )}

          {/* Step 2: Choose Category */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-cream-dark animate-fade-in">
              <h2 className="text-xl font-heading text-charcoal mb-6">Choose Room Category</h2>
              <p className="text-sm text-slate mb-4">{checkIn} to {checkOut} ({nights} nights)</p>

              {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : categories.length === 0 ? (
                <p className="text-slate text-center py-10">No categories available for the selected dates.</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {categories.map((cat) => {
                    const info = categoryLabels[cat.category] || { name: cat.category };
                    return (
                      <button
                        key={cat.category}
                        onClick={() => !cat.fullyBooked && setSelectedCategory(cat.category)}
                        disabled={cat.fullyBooked}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          cat.fullyBooked
                            ? "border-cream-dark opacity-50 cursor-not-allowed"
                            : selectedCategory === cat.category
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-cream-dark hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-heading text-charcoal">{info.name}</p>
                            <p className="text-xs text-slate">{cat.bedType} — {cat.availableRooms} of {cat.totalRooms} available</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-charcoal">GH₵ {cat.price}<span className="text-xs text-slate font-normal">/night</span></p>
                            <p className="text-xs text-slate">GH₵ {cat.price * nights} total</p>
                          </div>
                        </div>
                        {cat.fullyBooked && (
                          <p className="text-xs text-danger mt-2 font-medium">Fully booked for these dates</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-cream-dark text-charcoal rounded-lg text-sm hover:bg-cream-dark transition-colors">Back</button>
                <button onClick={() => { if (selectedCategory) setStep(3); }} disabled={!selectedCategory} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Guest Details */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-cream-dark animate-fade-in">
              <h2 className="text-xl font-heading text-charcoal mb-6">Guest Information</h2>
              {!user && (
                <div className="mb-6 p-4 bg-cream rounded-lg">
                  <p className="text-sm text-charcoal mb-2">Have an account?</p>
                  <div className="flex gap-2">
                    <a href="/login" className="text-sm text-primary hover:text-primary-dark font-medium">Sign in</a>
                    <span className="text-slate text-sm">or continue as guest</span>
                  </div>
                </div>
              )}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Full Name</label>
                  <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Email Address</label>
                  <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Phone Number</label>
                  <input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+233" className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>
              {selectedCatData && (
                <div className="bg-cream rounded-lg p-4 mb-6">
                  <h3 className="font-heading text-charcoal mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate">Room Type</span><span>{categoryLabels[selectedCategory]?.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate">Check-in</span><span>{checkIn}</span></div>
                    <div className="flex justify-between"><span className="text-slate">Check-out</span><span>{checkOut}</span></div>
                    <div className="flex justify-between"><span className="text-slate">Nights</span><span>{nights}</span></div>
                    <div className="flex justify-between"><span className="text-slate">Rate</span><span>GH₵ {selectedCatData.price}/night</span></div>
                    <div className="border-t border-cream-dark pt-2 mt-2 flex justify-between font-medium">
                      <span>Total</span><span className="text-primary text-lg">GH₵ {total}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate mt-3">A specific room will be assigned upon booking confirmation.</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-cream-dark text-charcoal rounded-lg text-sm hover:bg-cream-dark transition-colors">Back</button>
                <button onClick={handleCreateBooking} disabled={loading || !guestName || !guestEmail} className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
                  {loading ? "Processing..." : "Proceed to Payment"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && bookingResult && (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-cream-dark animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-heading text-charcoal">Booking Created</h2>
                <p className="text-slate text-sm mt-1">Your booking ID is</p>
                <p className="text-2xl font-heading text-primary mt-1">{bookingResult.bookingId}</p>
              </div>
              <div className="bg-cream rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate">Booking ID</span><span className="font-medium">{bookingResult.bookingId}</span></div>
                  <div className="flex justify-between"><span className="text-slate">Room Type</span><span>{categoryLabels[bookingResult.category]?.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate">Check-in</span><span>{checkIn}</span></div>
                  <div className="flex justify-between"><span className="text-slate">Check-out</span><span>{checkOut}</span></div>
                  <div className="flex justify-between"><span className="text-slate">Nights</span><span>{bookingResult.nights}</span></div>
                  <div className="border-t border-cream-dark pt-2 mt-2 flex justify-between font-medium">
                    <span>Amount Due</span><span className="text-primary text-lg">GH₵ {bookingResult.amount}</span>
                  </div>
                </div>
              </div>
              <button onClick={handlePayment} disabled={loading} className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors disabled:opacity-50">
                {loading ? "Processing..." : `Pay GH₵ ${bookingResult.amount} with Paystack`}
              </button>
              <p className="text-center text-xs text-slate mt-4">Secure payment powered by Paystack.</p>
              {/* <div className="mt-6 text-center">
                <button onClick={() => router.push(`/booking/confirmation?reference=${bookingResult?.paystackReference ?? bookingResult?.bookingId}`)} className="text-sm text-primary hover:text-primary-dark">
                  I&apos;ve completed payment — Check status
                </button>
              </div> */}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <script src="https://js.paystack.co/v2/inline.js" async />
    </main>
  );
}
