import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, rooms } from "@/db/schema";
import { eq, and, gte, lte, desc, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateBookingId } from "@/lib/booking";
import { updateRoomStatuses } from "@/lib/room-utils";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    await updateRoomStatuses();

    const conditions = [];
    if (status) conditions.push(eq(bookings.status, status as "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled"));
    if (userId) conditions.push(eq(bookings.userId, parseInt(userId)));

    if (!session || session.role === "customer") {
      if (session) {
        conditions.push(eq(bookings.userId, session.userId));
      } else {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({ booking: bookings, room: rooms })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(whereClause)
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ bookings: results });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const {
      roomId,
      roomIds,
      category, // For customer bookings: auto-assign from category
      guestName, guestEmail, guestPhone,
      checkIn, checkOut,
      userId, isGuest,
      source, // "online" or "walk_in"
      quantity = 1,
    } = body;

    if (!guestName || !guestEmail || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Guest name, email, check-in and check-out dates are required" }, { status: 400 });
    }

    if (!roomId && !category && !(roomIds && Array.isArray(roomIds) && roomIds.length > 0)) {
      return NextResponse.json({ error: "Either a room ID, room IDs, or category must be specified" }, { status: 400 });
    }

    // Validate dates
    const today = format(new Date(), "yyyy-MM-dd");
    if (checkIn < today) {
      return NextResponse.json({ error: "Check-in date cannot be in the past" }, { status: 400 });
    }
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "Check-out date must be after check-in date" }, { status: 400 });
    }

    // Support booking multiple rooms (quantity)

    // Prepare assignedRoomIds
    let assignedRoomIds: number[] = [];

    // If roomIds provided (explicit selection), use those
    if (roomIds && Array.isArray(roomIds) && roomIds.length > 0) {
      assignedRoomIds = roomIds.map((id: any) => parseInt(id));
    }

    // If category is provided instead of roomId, auto-assign available rooms
    if (!roomId && category) {
      const categoryRooms = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.category, category as "queen" | "deluxe" | "standard"), eq(rooms.status, "available")));

      // Try to find up to `quantity` rooms with no conflicting bookings
      for (const roomCandidate of categoryRooms) {
        if (assignedRoomIds.length >= quantity) break;
        const conflicting = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(
            and(
              eq(bookings.roomId, roomCandidate.id),
              ne(bookings.status, "cancelled"),
              lte(bookings.checkIn, checkOut),
              gte(bookings.checkOut, checkIn)
            )
          )
          .limit(1);

        if (conflicting.length === 0) {
          assignedRoomIds.push(roomCandidate.id);
        }
      }

      if (assignedRoomIds.length < quantity) {
        return NextResponse.json({ error: "Not enough available rooms in this category for the selected dates" }, { status: 409 });
      }
    }

    // If a specific roomId was provided, treat as single booking
    const singleRoomMode = !!roomId;
    if (singleRoomMode) {
      assignedRoomIds = [roomId];
    }

    // Validate and fetch all assigned rooms (fetch each by id)
    const fetchedRooms: any[] = [];
    for (const id of assignedRoomIds) {
      const [r] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
      if (!r) {
        return NextResponse.json({ error: "Room(s) not found" }, { status: 404 });
      }
      fetchedRooms.push(r);
    }

    // Double-check availability and maintenance for each assigned room
    for (const r of fetchedRooms) {
      if (r.status === "maintenance") {
        return NextResponse.json({ error: "One of the selected rooms is under maintenance" }, { status: 400 });
      }
      const conflict = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.roomId, r.id),
            ne(bookings.status, "cancelled"),
            lte(bookings.checkIn, checkOut),
            gte(bookings.checkOut, checkIn)
          )
        )
        .limit(1);
      if (conflict.length > 0) {
        return NextResponse.json({ error: `Room ${r.roomNumber} is not available for the selected dates` }, { status: 409 });
      }
    }

    // Calculate nights
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

    const bookingSource = source === "walk_in" ? "walk_in" : "online";
    const isWalkIn = bookingSource === "walk_in";
    const bookingStatus = isWalkIn ? "confirmed" : "pending";
    const paymentStatus = isWalkIn ? "paid" : "unpaid";

    // Create bookings for each assigned room
    const createdBookings: any[] = [];
    let totalAmount = 0;
    // Use a single group booking code (same format as booking IDs)
    const sharedGroupCode = await generateBookingId();
    for (const r of fetchedRooms) {
      const amount = r.price * nights;
      totalAmount += amount;
      // Each row needs its own unique bookingId (DB enforces unique constraint)
      const bookingId = await generateBookingId();
      let newBooking: any;
      try {
        [newBooking] = await db.insert(bookings).values({
          bookingId,
          groupBookingId: sharedGroupCode,
          userId: userId || null,
          roomId: r.id,
          guestName,
          guestEmail,
          guestPhone: guestPhone || null,
          checkIn,
          checkOut,
          status: bookingStatus,
          amount,
          paymentStatus,
          isGuest: isGuest || false,
          source: bookingSource,
        }).returning();
      } catch (e) {
        console.warn("Could not insert groupBookingId (column may not exist), retrying without it", e);
        [newBooking] = await db.insert(bookings).values({
          bookingId,
          userId: userId || null,
          roomId: r.id,
          guestName,
          guestEmail,
          guestPhone: guestPhone || null,
          checkIn,
          checkOut,
          status: bookingStatus,
          amount,
          paymentStatus,
          isGuest: isGuest || false,
          source: bookingSource,
        }).returning();
      }

      createdBookings.push({ booking: newBooking, roomNumber: r.roomNumber, category: r.category });

      if (isWalkIn) {
        await db.update(rooms).set({ status: "booked", updatedAt: new Date() }).where(eq(rooms.id, r.id));
      }
    }

    return NextResponse.json({
      bookings: createdBookings,
      nights,
      amount: totalAmount,
    }, { status: 201 });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "reception")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Booking ID and status are required" }, { status: 400 });
    }

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status, updatedAt: new Date() };

    if (status === "checked_in") {
      await db.update(rooms).set({ status: "booked", updatedAt: new Date() }).where(eq(rooms.id, booking.roomId));
    }

    if (status === "checked_out" || status === "cancelled") {
      await db.update(rooms).set({ status: "available", updatedAt: new Date() }).where(eq(rooms.id, booking.roomId));
    }

    const [updatedBooking] = await db.update(bookings).set(updateData).where(eq(bookings.id, id)).returning();
    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
