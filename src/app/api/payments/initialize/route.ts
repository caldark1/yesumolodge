import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, rooms, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Get booking details
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Booking has already been paid for" }, { status: 400 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Booking has been cancelled" }, { status: 400 });
    }

    // Initialize Paystack transaction
    // Avoid double-prefixing if booking.bookingId already contains the YML- prefix
    const reference = (booking.bookingId?.startsWith?.("YML-") ? `${booking.bookingId}` : `YML-${booking.bookingId}`) + `-${Date.now()}`;
    const result = await initializeTransaction(
      booking.guestEmail,
      booking.amount,
      reference,
      {
        booking_id: booking.id,
        booking_code: booking.bookingId,
        guest_name: booking.guestName,
        custom_fields: [
          { display_name: "Booking ID", variable_name: "booking_id", value: booking.bookingId },
          { display_name: "Guest Name", variable_name: "guest_name", value: booking.guestName },
        ],
      }
    );

    // Store payment record
    await db.insert(payments).values({
      bookingId: booking.id,
      reference: result.data.reference,
      amount: booking.amount,
      status: "pending",
      paystackResponse: result as unknown as Record<string, unknown>,
    });

    // Update booking with Paystack reference
    await db
      .update(bookings)
      .set({
        paystackReference: result.data.reference,
        accessCode: result.data.access_code,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    return NextResponse.json({
      accessCode: result.data.access_code,
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error) {
    console.error("Initialize payment error:", error);
    const message = error instanceof Error ? error.message : "Failed to initialize payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
