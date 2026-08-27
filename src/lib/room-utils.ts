import { db } from "@/db";
import { rooms, bookings } from "@/db/schema";
import { eq, and, lte, gte, lt, ne } from "drizzle-orm";
import { format, isBefore, startOfDay } from "date-fns";

export const ROOM_DATA = {
  queen: {
    category: "queen" as const,
    price: 450,
    bedType: "Queen Sized Bed",
    roomNumbers: [9, 12, 15, 16, 19, 20, 21, 24, 28, 27],
    description:
      "Premium room featuring a luxurious queen-sized bed, perfect for guests seeking extra comfort and elegance. Spacious layout with premium furnishings.",
    amenities: ["Air Conditioning", "Television", "Fridge", "Queen Sized Bed", "Free WiFi", "Hot Water"],
  },
  deluxe: {
    category: "deluxe" as const,
    price: 300,
    bedType: "Double Bed",
    roomNumbers: [10, 11, 18, 17, 13, 14, 22, 23, 25, 26, 29, 30],
    description:
      "Deluxe room with generous space and a comfortable double bed. Ideal for guests who prefer a roomy, relaxing environment.",
    amenities: ["Air Conditioning", "Television", "Fridge", "Double Bed", "Free WiFi", "Hot Water"],
  },
  standard: {
    category: "standard" as const,
    price: 250,
    bedType: "Double Bed",
    roomNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
    description:
      "Comfortable standard room with a double bed and all essential amenities. Great value for a pleasant stay.",
    amenities: ["Air Conditioning", "Television", "Fridge", "Double Bed", "Free WiFi", "Hot Water"],
  },
};

export type RoomCategory = keyof typeof ROOM_DATA;

/**
 * Check and update room statuses based on current bookings.
 * Rooms whose bookings have checked out should be marked available.
 * This should be called periodically or before fetching room data.
 */
export async function updateRoomStatuses(): Promise<void> {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  // Find rooms that are booked but have no active bookings (all bookings checked out or cancelled)
  const bookedRooms = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(eq(rooms.status, "booked"));

  for (const room of bookedRooms) {
    // Check if there are any active bookings for this room
    const activeBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, room.id),
          eq(bookings.status, "confirmed"),
          gte(bookings.checkOut, today)
        )
      )
      .limit(1);

    if (activeBookings.length === 0) {
      // No active bookings, mark room as available
      await db
        .update(rooms)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(rooms.id, room.id));
    }
  }

  // Also check: mark bookings as checked_out if checkout date has passed
  const expiredBookings = await db
    .select({ id: bookings.id, roomId: bookings.roomId })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        lt(bookings.checkOut, today),
        eq(bookings.paymentStatus, "paid")
      )
    );

  for (const booking of expiredBookings) {
    await db
      .update(bookings)
      .set({ status: "checked_out", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));
  }
}

/**
 * Check if a room is available for given dates
 */
export async function isRoomAvailable(
  roomId: number,
  checkIn: string,
  checkOut: string
): Promise<boolean> {
  const conflictingBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.roomId, roomId),
        ne(bookings.status, "cancelled"),
        lte(bookings.checkIn, checkOut),
        gte(bookings.checkOut, checkIn)
      )
    )
    .limit(1);

  return conflictingBookings.length === 0;
}
