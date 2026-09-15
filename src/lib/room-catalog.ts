export type RoomCategoryKey = "queen" | "deluxe" | "standard";

export type RoomCatalogEntry = {
  name: string;
  price: number;
  roomCount: number;
  description: string;
  policy: string;
  amenities: string[];
  images: string[];
  accent: string;
  badge: string;
};

export const ROOM_CATALOG: Record<RoomCategoryKey, RoomCatalogEntry> = {
  queen: {
    name: "Queen Suite",
    price: 450,
    roomCount: 10,
    description:
      "A refined premium suite with a spacious queen-size bed, elevated finishes, and a calming luxury feel for longer stays.",
    policy:
      "Check-in from 2:00 PM. Check-out by 12:00 PM. Complimentary breakfast can be added on request. Cancellation within 48 hours is subject to a one-night fee.",
    amenities: ["Queen Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water", "Workspace"],
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "from-primary-dark via-primary to-charcoal",
    badge: "Luxury stay",
  },
  deluxe: {
    name: "Deluxe Room",
    price: 350,
    roomCount: 12,
    description:
      "Our signature deluxe room pairs generous space with a warm, modern aesthetic designed for rest, work, and easy comfort.",
    policy:
      "Flexible check-in from 2:00 PM. Late check-out is subject to availability. Children under 12 stay free when sharing a bed with parents.",
    amenities: ["Double Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water", "Room Service"],
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    ],
    accent: "from-primary via-primary-light to-primary-dark",
    badge: "Most booked",
  },
  standard: {
    name: "Standard Room",
    price: 300,
    roomCount: 8,
    description:
      "A welcoming and practical option with all the essentials for a comfortable and restful stay at a great value.",
    policy:
      "Standard check-in from 2:00 PM and check-out by 12:00 PM. Valid ID is required at arrival. Early check-in is subject to room availability.",
    amenities: ["Double Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    ],
    accent: "from-primary-light via-amber-200 to-primary",
    badge: "Great value",
  },
};

const STORAGE_KEY = "room-catalog-settings";

export function readCatalogSettings(): Partial<Record<RoomCategoryKey, Partial<RoomCatalogEntry>>> {
  if (typeof window === "undefined") return {};

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function writeCatalogSettings(value: Record<RoomCategoryKey, RoomCatalogEntry>) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function resolveCatalog(): Record<RoomCategoryKey, RoomCatalogEntry> {
  const saved = readCatalogSettings();

  return {
    queen: { ...ROOM_CATALOG.queen, ...saved.queen },
    deluxe: { ...ROOM_CATALOG.deluxe, ...saved.deluxe },
    standard: { ...ROOM_CATALOG.standard, ...saved.standard },
  };
}
