"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

type CategoryItem = {
  category: "queen" | "deluxe" | "standard";
  name: string;
  price: number;
  description: string;
  policy: string;
  amenities: string[];
  images: string[];
  badge: string;
  accent: string;
};

export default function RoomCategoryDetailPage() {
  const params = useParams<{ category: string }>();
  const [room, setRoom] = useState<CategoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRoom(null);

      try {
        const res = await fetch("/api/room-categories");
        const data = await res.json();
        const match = (data.categories || []).find((item: CategoryItem) => item.category === params.category);
        setRoom(match || null);
      } catch (error) {
        console.error("Failed to load room category", error);
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.category) load();
  }, [params.category]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cream">
        <Navbar />
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-24 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Loading room</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen bg-cream">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Not Found</p>
          <h1 className="mt-4 font-heading text-4xl text-charcoal">This room category doesn&apos;t exist.</h1>
          <Link href="/rooms" className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-dark">
            Back to rooms
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <section className="pb-10 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/rooms" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark">
            ← Back to All Rooms
          </Link>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="overflow-hidden rounded-[28px] border border-cream-dark bg-white shadow-sm">
            <div
              className="relative h-[440px] bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(11,17,17,0.2), rgba(11,17,17,0.45)), url('${room.images[activeImage]}')`,
              }}
            >
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-charcoal/80 via-charcoal/15 to-transparent p-5">
                {room.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-all ${
                      index === activeImage ? "border-white" : "border-white/40"
                    }`}
                    aria-label={`View room photo ${index + 1}`}
                  >
                    <img src={image} alt={`${room.name} view ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-cream-dark bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-accent">{room.badge}</p>
            <h1 className="mt-3 font-heading text-4xl text-charcoal">{room.name}</h1>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-4xl font-heading text-primary">GH₵ {room.price}</span>
              <span className="text-sm text-slate">per night</span>
            </div>

            <p className="mt-5 text-base leading-7 text-slate">{room.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {room.amenities.map((item) => (
                <span key={item} className="rounded-full bg-cream-dark px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-charcoal/70">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href={`/booking?category=${room.category}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-base font-medium text-white transition-colors hover:bg-primary-dark"
              >
                Book Now
              </Link>
              <Link
                href="/booking"
                className="inline-flex w-full items-center justify-center rounded-xl border border-cream-dark bg-cream px-5 py-3.5 text-base font-medium text-charcoal transition-colors hover:bg-cream-dark"
              >
                Check Availability
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[28px] border border-cream-dark bg-white p-7 shadow-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Room details</p>
            <h2 className="mt-3 font-heading text-3xl text-charcoal">What&apos;s included</h2>
            <ul className="mt-6 space-y-3">
              {room.amenities.map((item) => (
                <li key={item} className="flex items-center gap-3 text-charcoal/80">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-cream-dark bg-white p-7 shadow-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Policies</p>
            <h2 className="mt-3 font-heading text-3xl text-charcoal">Stay information</h2>
            <p className="mt-6 leading-7 text-slate">{room.policy}</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
