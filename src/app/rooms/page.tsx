"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

const categoryLabels: Record<string, { name: string; color: string }> = {
  queen: { name: "Queen Suite", color: "from-primary-dark to-primary" },
  deluxe: { name: "Deluxe Room", color: "from-primary to-primary-light" },
  standard: { name: "Standard Room", color: "from-primary-light to-primary-lighter" },
};

export default function RoomsPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  useEffect(() => {
    fetchCategories();
  }, [checkIn, checkOut]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: "categories" });
      if (checkIn) params.set("checkIn", checkIn);
      if (checkOut) params.set("checkOut", checkOut);
      const res = await fetch(`/api/rooms?${params}`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-12 bg-gradient-to-br from-charcoal to-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-accent text-sm tracking-[0.2em] uppercase mb-2">Accommodation</p>
          <h1 className="text-4xl sm:text-5xl font-heading text-white mb-4">Our Rooms</h1>
          <p className="text-white/60 max-w-lg">Browse our 30 well-appointed rooms across three categories. All rooms feature air conditioning, television, and fridge.</p>
        </div>
      </section>

      <section className="py-10 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Date Filter */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-cream-dark">
            <h3 className="text-sm font-medium text-charcoal mb-3">Check availability for specific dates</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-charcoal mb-1.5">Check-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-charcoal mb-1.5">Check-out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <button
                onClick={() => { setCheckIn(""); setCheckOut(""); }}
                className="px-4 py-2.5 text-sm text-slate hover:text-charcoal transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((cat) => {
                const info = categoryLabels[cat.category] || { name: cat.category, color: "from-primary to-primary-light" };
                return (
                  <div
                    key={cat.category}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-cream-dark"
                  >
                    <div className={`h-48 bg-gradient-to-br ${info.color} flex items-center justify-center relative`}>
                      <div className="text-center">
                        <p className="text-white/80 text-sm mb-1">{info.name}</p>
                        <p className="text-white text-4xl font-heading">GH₵ {cat.price}</p>
                        <p className="text-white/70 text-xs mt-1">per night</p>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-white text-xs">{cat.totalRooms} rooms</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-heading text-charcoal mb-2">{info.name}</h3>
                      <p className="text-slate text-sm mb-4">{cat.description}</p>

                      {/* Availability */}
                      <div className="mb-4">
                        {cat.fullyBooked ? (
                          <div className="flex items-center gap-2 p-3 bg-danger/10 rounded-lg">
                            <svg className="w-4 h-4 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm font-medium text-danger">Fully Booked</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
                            <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-success">
                              {cat.availableRooms} of {cat.totalRooms} available
                            </span>
                          </div>
                        )}
                        {cat.maintenanceRooms > 0 && (
                          <p className="text-xs text-warning mt-1">{cat.maintenanceRooms} under maintenance</p>
                        )}
                      </div>

                      {/* Amenities */}
                      <ul className="space-y-1.5 mb-6">
                        {cat.amenities.map((a) => (
                          <li key={a} className="flex items-center gap-2 text-sm text-charcoal/70">
                            <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {a}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={cat.fullyBooked ? "#" : `/booking?category=${cat.category}`}
                        className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          cat.fullyBooked
                            ? "bg-cream-dark text-slate cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary-dark"
                        }`}
                        onClick={(e) => cat.fullyBooked && e.preventDefault()}
                      >
                        {cat.fullyBooked ? "Fully Booked" : "Book Now"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
