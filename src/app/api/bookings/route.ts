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
      category, // For customer bookings: auto-assign from category
      guestName, guestEmail, guestPhone,
      checkIn, checkOut,
      userId, isGuest,
      source, // "online" or "walk_in"
    } = body;

    if (!guestName || !guestEmail || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Guest name, email, check-in and check-out dates are required" }, { status: 400 });
    }

    if (!roomId && !category) {
      return NextResponse.json({ error: "Either a room ID or category must be specified" }, { status: 400 });
    }

    // Validate dates
    const today = format(new Date(), "yyyy-MM-dd");
    if (checkIn < today) {
      return NextResponse.json({ error: "Check-in date cannot be in the past" }, { status: 400 });
    }
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "Check-out date must be after check-in date" }, { status: 400 });
    }

    let assignedRoomId = roomId;

    // If category is provided instead of roomId, auto-assign an available room
    if (!roomId && category) {
      const categoryRooms = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.category, category as "queen" | "deluxe" | "standard"), eq(rooms.status, "available")));

      // Find first room with no conflicting bookings
      for (const room of categoryRooms) {
        const conflicting = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(
            and(
              eq(bookings.roomId, room.id),
              ne(bookings.status, "cancelled"),
              lte(bookings.checkIn, checkOut),
              gte(bookings.checkOut, checkIn)
            )
          )
          .limit(1);

        if (conflicting.length === 0) {
          assignedRoomId = room.id;
          break;
        }
      }

      if (!assignedRoomId) {
        return NextResponse.json({ error: "No available rooms in this category for the selected dates" }, { status: 409 });
      }
    }

    // Get the assigned room
    const [room] = await db.select().from(rooms).where(eq(rooms.id, assignedRoomId)).limit(1);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (room.status === "maintenance") {
      return NextResponse.json({ error: "Room is under maintenance" }, { status: 400 });
    }

    // Double-check availability for the specific room
    const conflicting = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, assignedRoomId),
          ne(bookings.status, "cancelled"),
          lte(bookings.checkIn, checkOut),
          gte(bookings.checkOut, checkIn)
        )
      )
      .limit(1);

    if (conflicting.length > 0) {
      return NextResponse.json({ error: "Room is not available for the selected dates" }, { status: 409 });
    }

    // Calculate total amount
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const amount = room.price * nights;

    // Generate unique booking ID
    const bookingId = await generateBookingId();

    const bookingSource = source === "walk_in" ? "walk_in" : "online";

    // For walk-in bookings, mark as confirmed and paid immediately
    const isWalkIn = bookingSource === "walk_in";
    const bookingStatus = isWalkIn ? "confirmed" : "pending";
    const paymentStatus = isWalkIn ? "paid" : "unpaid";

    // Create booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        bookingId,
        userId: userId || null,
        roomId: assignedRoomId,
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
      })
      .returning();

    // For walk-in, mark room as booked immediately
    if (isWalkIn) {
      await db.update(rooms).set({ status: "booked", updatedAt: new Date() }).where(eq(rooms.id, assignedRoomId));
    }

    return NextResponse.json({
      booking: newBooking,
      roomNumber: room.roomNumber,
      category: room.category,
      nights,
      amount,
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
