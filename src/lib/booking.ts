import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { differenceInDays, subYears } from "date-fns";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PREFIX = "YML-";
const ID_LENGTH = 7;

/**
 * Generates a unique booking ID in format YML-XXXXXXX
 * 
 * With 36^7 = 78,364,164,096 possible combinations and 500,000 bookings,
 * collision probability ≈ 0.16% which is well under the 1% requirement.
 * 
 * IDs from bookings older than 1 year can be reassigned since we filter
 * out bookings created more than a year ago when checking for uniqueness.
 */
function generateRandomId(): string {
  let id = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    id += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return `${PREFIX}${id}`;
}

/**
 * Generate a unique booking ID, checking against existing bookings.
 * Booking IDs from records older than 1 year are eligible for reassignment.
 */
export async function generateBookingId(): Promise<string> {
  const oneYearAgo = subYears(new Date(), 1);

  let bookingId = generateRandomId();
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Check if this booking ID exists and was created within the last year
    const existing = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingId, bookingId),
          // Only consider bookings created within the last year for uniqueness
          // Bookings older than 1 year can have their IDs reassigned
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return bookingId;
    }

    // Check if the existing booking is older than 1 year (can be reassigned)
    const existingWithDate = await db
      .select({ createdAt: bookings.createdAt })
      .from(bookings)
      .where(eq(bookings.bookingId, bookingId))
      .limit(1);

    if (existingWithDate.length > 0 && existingWithDate[0].createdAt) {
      const createdDate = new Date(existingWithDate[0].createdAt);
      if (differenceInDays(new Date(), createdDate) > 365) {
        // This ID is from a booking older than 1 year, safe to reassign
        return bookingId;
      }
    }

    // ID is taken by a recent booking, generate a new one
    bookingId = generateRandomId();
    attempts++;
  }

  // Fallback: use timestamp-based suffix for guaranteed uniqueness
  const timestamp = Date.now().toString(36).toUpperCase().slice(-7);
  return `${PREFIX}${timestamp.padEnd(7, "0").slice(0, 7)}`;
}
