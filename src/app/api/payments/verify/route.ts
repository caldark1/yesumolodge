import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, rooms, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    // Resolve input reference: it may be a Paystack reference or a booking code.
    console.log(`Received verify request for reference=${reference}`);

    // Try to find a payment that matches this reference exactly
    const [exactPayment] = await db.select().from(payments).where(eq(payments.reference, reference)).limit(1);
    let refToVerify: string | null = null;
    if (exactPayment) {
      refToVerify = exactPayment.reference;
      console.log(`Found exact payment record id=${exactPayment.id} bookingId=${exactPayment.bookingId}`);
    } else {
      // Try to resolve as booking code -> lookup booking.paystackReference or payment by bookingId
      const [bookingByCode] = await db.select().from(bookings).where(eq(bookings.bookingId, reference)).limit(1);
      if (bookingByCode) {
        console.log(`Found booking by code=${bookingByCode.bookingId} id=${bookingByCode.id} paystackReference=${bookingByCode.paystackReference}`);
        if (bookingByCode.paystackReference) {
          refToVerify = bookingByCode.paystackReference;
        } else {
          const [paymentByBooking] = await db.select().from(payments).where(eq(payments.bookingId, bookingByCode.id)).limit(1);
          if (paymentByBooking) {
            refToVerify = paymentByBooking.reference;
            console.log(`Found payment by booking id=${bookingByCode.id} reference=${refToVerify}`);
          }
        }
      }
    }

    // Fallback: use the provided reference
    if (!refToVerify) {
      refToVerify = reference;
      console.log(`No mapped payment found; will verify provided reference=${reference}`);
    }

    // Verify with Paystack
    console.log(`Verifying with Paystack reference=${refToVerify}`);
    const result = await verifyTransaction(refToVerify);
    console.log(`Paystack verify response for ${refToVerify}: status=${result.status} data.status=${result?.data?.status}`);

    if (!result.status) {
      console.error(`Paystack verification failed for ${refToVerify}`);
      return NextResponse.json({ error: "Verification failed", result }, { status: 400 });
    }

    // Check if payment was successful
    if (result.data.status === "success") {
      // Find the payment record
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.reference, reference))
        .limit(1);
      console.log(`Lookup payment by reference=${reference}: found=${!!payment} id=${payment?.id} bookingId=${payment?.bookingId}`);

      if (payment && payment.status !== "success") {
        // Update payment status
        await db
          .update(payments)
          .set({
            status: "success",
            paystackResponse: result as unknown as Record<string, unknown>,
          })
          .where(eq(payments.reference, reference));
        console.log(`Updated payment record id=${payment.id} to success for reference=${reference}`);

        // Update booking payment status and confirm booking
        const [booking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .limit(1);
        console.log(`Lookup booking by id=${payment.bookingId}: found=${!!booking} bookingId=${booking?.bookingId}`);

        if (booking) {
          await db
            .update(bookings)
            .set({
              paymentStatus: "paid",
              status: "confirmed",
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, booking.id));
          console.log(`Updated booking id=${booking.id} paymentStatus=paid status=confirmed`);

          // Mark room as booked
          await db
            .update(rooms)
            .set({ status: "booked", updatedAt: new Date() })
            .where(eq(rooms.id, booking.roomId));
          console.log(`Marked room id=${booking.roomId} as booked`);
        }
      }
    }

    return NextResponse.json({
      status: result.data.status,
      amount: result.data.amount / 100, // Convert from pesewas to cedis
      reference: result.data.reference,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Webhook handler for Paystack
  try {
    const body = await request.json();

    // Verify webhook signature (in production, you should verify the signature)
    const event = body.event;
    const data = body.data;
    console.log(`Received Paystack webhook event=${event} reference=${data?.reference}`);

    if (event === "charge.success" && data.status === "success") {
      const reference = data.reference;

      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.reference, reference))
        .limit(1);
      console.log(`Webhook lookup payment reference=${reference}: found=${!!payment} id=${payment?.id}`);

      if (payment && payment.status !== "success") {
        await db
          .update(payments)
          .set({
            status: "success",
            paystackResponse: data as Record<string, unknown>,
          })
          .where(eq(payments.reference, reference));
        console.log(`Webhook updated payment id=${payment.id} to success`);

        const [booking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .limit(1);
        console.log(`Webhook lookup booking id=${payment.bookingId}: found=${!!booking} bookingId=${booking?.bookingId}`);

        if (booking) {
          await db
            .update(bookings)
            .set({
              paymentStatus: "paid",
              status: "confirmed",
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, booking.id));
          console.log(`Webhook updated booking id=${booking.id} to paid/confirmed`);

          await db
            .update(rooms)
            .set({ status: "booked", updatedAt: new Date() })
            .where(eq(rooms.id, booking.roomId));
          console.log(`Webhook marked room id=${booking.roomId} as booked`);
        }
      } else {
        if (!payment) console.warn(`Webhook: no payment record found for reference=${reference}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
