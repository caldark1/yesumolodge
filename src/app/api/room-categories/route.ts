import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { roomCategories, rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ROOM_DATA } from "@/lib/room-utils";

const fallbackCategories = {
  queen: {
    category: "queen",
    name: "Queen Suite",
    price: 450,
    description: "A refined premium suite with a spacious queen-size bed, elevated finishes, and a calming luxury feel for longer stays.",
    policy: "Check-in from 2:00 PM. Check-out by 12:00 PM. Complimentary breakfast can be added on request. Cancellation within 48 hours is subject to a one-night fee.",
    amenities: ["Queen Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water", "Workspace"],
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    ],
    badge: "Luxury stay",
    accent: "from-primary-dark via-primary to-charcoal",
  },
  deluxe: {
    category: "deluxe",
    name: "Deluxe Room",
    price: 350,
    description: "Our signature deluxe room pairs generous space with a warm, modern aesthetic designed for rest, work, and easy comfort.",
    policy: "Flexible check-in from 2:00 PM. Late check-out is subject to availability. Children under 12 stay free when sharing a bed with parents.",
    amenities: ["Double Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water", "Room Service"],
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    ],
    badge: "Most booked",
    accent: "from-primary via-primary-light to-primary-dark",
  },
  standard: {
    category: "standard",
    name: "Standard Room",
    price: 300,
    description: "A welcoming and practical option with all the essentials for a comfortable and restful stay at a great value.",
    policy: "Standard check-in from 2:00 PM and check-out by 12:00 PM. Valid ID is required at arrival. Early check-in is subject to room availability.",
    amenities: ["Double Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    badge: "Great value",
    accent: "from-primary-light via-amber-200 to-primary",
  },
} as const;

type RoomCategoryKey = keyof typeof fallbackCategories;

function normalizeCategory(category: string): RoomCategoryKey | null {
  return category === "queen" || category === "deluxe" || category === "standard" ? category : null;
}

export async function GET() {
  try {
    const rows = await db.select().from(roomCategories);

    if (rows.length === 0) {
      const seeded: Record<string, any>[] = [];
      const categoryEntries = Object.entries(fallbackCategories) as Array<[
        RoomCategoryKey,
        (typeof fallbackCategories)[RoomCategoryKey]
      ]>;

      for (const [category, data] of categoryEntries) {
        const categoryValue = category as "queen" | "deluxe" | "standard";
        const inserted = await db.insert(roomCategories).values({
          category: categoryValue,
          name: data.name,
          price: data.price,
          description: data.description,
          policy: data.policy,
          amenities: data.amenities,
          images: data.images,
          badge: data.badge,
          accent: data.accent,
        } as any).returning();
        seeded.push(inserted[0]);
      }
      return NextResponse.json({ categories: seeded });
    }

    return NextResponse.json({ categories: rows });
  } catch (error) {
    console.error("Get room categories error:", error);
    return NextResponse.json({ error: "Failed to fetch room categories" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const category = normalizeCategory(body.category);
    if (!category) {
      return NextResponse.json({ error: "Valid room category is required" }, { status: 400 });
    }

    const nextValues = {
      category: category as "queen" | "deluxe" | "standard",
      name: body.name || fallbackCategories[category].name,
      price: Number(body.price ?? fallbackCategories[category].price),
      description: body.description || fallbackCategories[category].description,
      policy: body.policy || fallbackCategories[category].policy,
      amenities: Array.isArray(body.amenities) && body.amenities.length > 0 ? body.amenities : fallbackCategories[category].amenities,
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : fallbackCategories[category].images,
      badge: body.badge || fallbackCategories[category].badge,
      accent: body.accent || fallbackCategories[category].accent,
      updatedAt: new Date(),
    } as any;

    const existing = await db.select().from(roomCategories).where(eq(roomCategories.category, category)).limit(1);

    let saved;
    if (existing.length > 0) {
      [saved] = await db.update(roomCategories).set(nextValues).where(eq(roomCategories.category, category)).returning();
    } else {
      [saved] = await db.insert(roomCategories).values(nextValues).returning();
    }

    // Sync the actual room prices for future booking calculations.
    await db.update(rooms)
      .set({
        price: Number(nextValues.price),
        updatedAt: new Date(),
      })
      .where(eq(rooms.category, category));

    return NextResponse.json({ category: saved });
  } catch (error) {
    console.error("Update room categories error:", error);
    return NextResponse.json({ error: "Failed to update room category" }, { status: 500 });
  }
}
