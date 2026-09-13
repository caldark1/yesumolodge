import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, rooms, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, bookingIds, bookingCode, extensionId } = body;

    // Resolve bookings to charge
    let bookingsToCharge: any[] = [];

    // If charging for an extension, resolve extension and charge its amount
    if (extensionId) {
      const [ext] = await db.select().from((await import("@/db/schema")).extensions).where((await import("drizzle-orm")).eq((await import("@/db/schema")).extensions.id, parseInt(extensionId))).limit(1);
      if (!ext) return NextResponse.json({ error: `Extension ${extensionId} not found` }, { status: 404 });
      if (ext.paymentStatus === "paid") return NextResponse.json({ error: `Extension ${extensionId} has already been paid` }, { status: 400 });
      // Load the original booking to attach reference
      const [b] = await db.select().from(bookings).where(eq(bookings.id, ext.bookingId)).limit(1);
      if (!b) return NextResponse.json({ error: `Associated booking ${ext.bookingId} not found` }, { status: 404 });
      bookingsToCharge = [b];
    }

    if (bookingCode) {
      // Load bookings by shared booking code: check groupBookingId first, then bookingId
      let results = await db.select().from(bookings).where(eq(bookings.groupBookingId, bookingCode));
      if (!results || results.length === 0) {
        results = await db.select().from(bookings).where(eq(bookings.bookingId, bookingCode));
      }
      if (!results || results.length === 0) return NextResponse.json({ error: `Booking code ${bookingCode} not found` }, { status: 404 });
      bookingsToCharge = results;
    } else {
      if (!bookingId && (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0)) {
        return NextResponse.json({ error: "Booking ID or bookingIds array is required" }, { status: 400 });
      }

      let targetBookingIds: number[] = [];
      if (bookingIds && Array.isArray(bookingIds) && bookingIds.length > 0) {
        targetBookingIds = bookingIds.map((id: any) => parseInt(id));
      } else if (bookingId) {
        targetBookingIds = [parseInt(bookingId)];
      }

      for (const id of targetBookingIds) {
        const [b] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
        if (!b) return NextResponse.json({ error: `Booking ${id} not found` }, { status: 404 });
        bookingsToCharge.push(b);
      }
    }

    // Basic validations
    for (const b of bookingsToCharge) {
      if (b.paymentStatus === "paid") return NextResponse.json({ error: `Booking ${b.id} has already been paid for` }, { status: 400 });
      if (b.status === "cancelled") return NextResponse.json({ error: `Booking ${b.id} has been cancelled` }, { status: 400 });
    }

    let totalAmount = bookingsToCharge.reduce((sum, b) => sum + b.amount, 0);
    let extRecord: any = null;
    if (extensionId) {
      const [ext] = await db.select().from((await import("@/db/schema")).extensions).where((await import("drizzle-orm")).eq((await import("@/db/schema")).extensions.id, parseInt(extensionId))).limit(1);
      if (!ext) return NextResponse.json({ error: `Extension ${extensionId} not found` }, { status: 404 });
      extRecord = ext;
      totalAmount = ext.amount;
    }

    // Initialize Paystack transaction for total amount
    const primary = bookingsToCharge[0];
    const reference = (primary.bookingId?.startsWith?.("YML-") ? `${primary.bookingId}` : `YML-${primary.bookingId}`) + `-${Date.now()}`;
    console.log(`Initializing payment for bookings=${bookingsToCharge.map((b) => b.id).join(",")} total=${totalAmount}`);
    const result = await initializeTransaction(
      primary.guestEmail,
      totalAmount,
      reference,
      {
        booking_ids: bookingsToCharge.map((b) => b.id),
        booking_code: primary.bookingId,
        guest_name: primary.guestName,
        custom_fields: [
          { display_name: "Booking IDs", variable_name: "booking_ids", value: JSON.stringify(bookingsToCharge.map((b) => b.id)) },
          ...(extensionId ? [{ display_name: "Extension ID", variable_name: "extension_id", value: String(extensionId) }] : []),
          { display_name: "Guest Name", variable_name: "guest_name", value: primary.guestName },
        ],
      }
    );

    // Store payment record (link to first bookingId); try to include bookingIds if DB supports it
    let insertedPayment: any = null;
    try {
      [insertedPayment] = await db.insert(payments).values({
        bookingId: primary.id,
        extensionId: extensionId ? parseInt(extensionId) : undefined,
        bookingIds: JSON.stringify(bookingsToCharge.map((b) => b.id)),
        reference: result.data.reference,
        amount: totalAmount,
        status: "pending",
        paystackResponse: result as unknown as Record<string, unknown>,
      }).returning();
      console.log(`Stored payment record id=${insertedPayment?.id} reference=${insertedPayment?.reference}`);
    } catch (e) {
      console.warn("Could not store bookingIds in payments table, falling back to legacy insert", e);
      [insertedPayment] = await db.insert(payments).values({
        bookingId: primary.id,
        extensionId: extensionId ? parseInt(extensionId) : undefined,
        reference: result.data.reference,
        amount: totalAmount,
        status: "pending",
        paystackResponse: result as unknown as Record<string, unknown>,
      }).returning();
      console.log(`Stored payment record id=${insertedPayment?.id} reference=${insertedPayment?.reference} (legacy)`);
    }

    // Update each booking with paystack reference/access code
    for (const b of bookingsToCharge) {
      await db.update(bookings).set({ paystackReference: result.data.reference, accessCode: result.data.access_code, updatedAt: new Date() }).where(eq(bookings.id, b.id));
    }

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
