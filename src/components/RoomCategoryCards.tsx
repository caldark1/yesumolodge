"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function RoomCategoryCards() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/room-categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to load room categories", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {categories.map((room) => (
        <article
          key={room.category}
          className="group overflow-hidden rounded-[28px] border border-cream-dark bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div
            className={`relative h-72 bg-gradient-to-br ${room.accent} px-5 py-5`}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(16,25,22,0.2), rgba(16,25,22,0.72)), url('${room.images[0]}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  {room.badge}
                </span>
              </div>

              <div className="text-left text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-white/75">{room.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-heading">GH₵ {room.price}</span>
                  <span className="text-sm text-white/75">/ night</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <p className="text-sm leading-6 text-slate">{room.description}</p>

            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 4).map((amenity) => (
                <span key={amenity} className="rounded-full bg-cream-dark px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-charcoal/70">
                  {amenity}
                </span>
              ))}
            </div>

            <Link
              href={`/rooms/${room.category}`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              View Rooms
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
