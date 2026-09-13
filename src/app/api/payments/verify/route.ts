import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, rooms, payments, extensions } from "@/db/schema";
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
      // Try to resolve as booking code -> lookup by groupBookingId or bookingId
      const [bookingByGroup] = await db.select().from(bookings).where(eq(bookings.groupBookingId, reference)).limit(1);
      if (bookingByGroup) {
        console.log(`Found booking by group code=${bookingByGroup.groupBookingId} id=${bookingByGroup.id} paystackReference=${bookingByGroup.paystackReference}`);
        if (bookingByGroup.paystackReference) {
          refToVerify = bookingByGroup.paystackReference;
        } else {
          const [paymentByBooking] = await db.select().from(payments).where(eq(payments.bookingId, bookingByGroup.id)).limit(1);
          if (paymentByBooking) {
            refToVerify = paymentByBooking.reference;
            console.log(`Found payment by booking id=${bookingByGroup.id} reference=${refToVerify}`);
          }
        }
      } else {
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
    }

    // Fallback: use the provided reference
    if (!refToVerify) {
      refToVerify = reference;
      console.log(`No mapped payment found; will verify provided reference=${reference}`);
    }

    // If we already have a payment record marked success in DB, prefer that and ensure bookings are updated
    const [existingPaymentRecord] = await db.select().from(payments).where(eq(payments.reference, refToVerify)).limit(1);
    if (existingPaymentRecord && existingPaymentRecord.status === "success") {
      // Ensure related bookings are marked paid/confirmed (in case webhook didn't finish)
      let bookingIdsToUpdate: number[] = [];
      try {
        if (existingPaymentRecord.bookingIds) {
          bookingIdsToUpdate = typeof existingPaymentRecord.bookingIds === "string" ? JSON.parse(existingPaymentRecord.bookingIds) : existingPaymentRecord.bookingIds;
        } else if (existingPaymentRecord.bookingId) {
          bookingIdsToUpdate = [existingPaymentRecord.bookingId];
        }
      } catch (e) {
        bookingIdsToUpdate = existingPaymentRecord.bookingId ? [existingPaymentRecord.bookingId] : [];
      }

      if (!bookingIdsToUpdate || bookingIdsToUpdate.length === 0) {
        const bookingsWithRef = await db.select().from(bookings).where(eq(bookings.paystackReference, refToVerify));
        bookingIdsToUpdate = bookingsWithRef.map((b: any) => b.id);
      }

      for (const bid of bookingIdsToUpdate) {
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, bid)).limit(1);
        if (!booking) continue;
        if (booking.paymentStatus !== "paid") {
          await db.update(bookings).set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() }).where(eq(bookings.id, booking.id));
          await db.update(rooms).set({ status: "booked", updatedAt: new Date() }).where(eq(rooms.id, booking.roomId));
        }
      }

      return NextResponse.json({ status: "success", amount: existingPaymentRecord.amount, reference: existingPaymentRecord.reference });
    }

    // Verify with Paystack
    console.log("Verifying with Paystack reference=", refToVerify);
    const result = await verifyTransaction(refToVerify);
    const resultStatus = result && typeof result === "object" && "status" in result ? (result as any).status : null;
    const dataStatus = result && (result as any).data ? (result as any).data.status : null;
    console.log("Paystack verify response for", refToVerify, "status=", resultStatus, "data.status=", dataStatus);

    if (!result || !resultStatus) {
      console.error("Paystack verification failed for", refToVerify);
      return NextResponse.json({ error: "Verification failed", result }, { status: 400 });
    }

    // Check if payment was successful
    if (result.data.status === "success") {
      // Find the payment record
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.reference, refToVerify))
        .limit(1);
      console.log("Lookup payment by reference=", refToVerify, "found=", !!payment, "id=", payment?.id, "bookingId=", payment?.bookingId);

      // If payment record exists and is not yet marked success, update it
      if (payment && payment.status !== "success") {
        await db
          .update(payments)
          .set({
            status: "success",
            paystackResponse: result as unknown as Record<string, unknown>,
          })
          .where(eq(payments.reference, refToVerify));
        console.log("Updated payment record id=", payment.id, "to success for reference=", refToVerify);
        // If this payment was for an extension, mark the extension paid and update booking checkOut
        try {
          if (payment.extensionId) {
            const [ext] = await db.select().from(extensions).where(eq(extensions.id, payment.extensionId)).limit(1);
            if (ext) {
              await db.update(extensions).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(extensions.id, ext.id));
              // Update booking checkOut to extension.newCheckOut
              await db.update(bookings).set({ checkOut: ext.newCheckOut, updatedAt: new Date() }).where(eq(bookings.id, ext.bookingId));
              console.log(`Marked extension id=${ext.id} paid and updated booking id=${ext.bookingId} checkOut to ${ext.newCheckOut}`);
            }
          }
        } catch (e) {
          console.warn("Failed to mark extension paid:", e);
        }
      }

      // Determine bookings to update: prefer payment.bookingIds, otherwise bookings with this paystack reference
      let bookingIdsToUpdate: number[] = [];
      if (payment) {
        try {
          if (payment.bookingIds) {
            bookingIdsToUpdate = typeof payment.bookingIds === "string" ? JSON.parse(payment.bookingIds) : payment.bookingIds;
          } else if (payment.bookingId) {
            bookingIdsToUpdate = [payment.bookingId];
          }
        } catch (e) {
          bookingIdsToUpdate = payment.bookingId ? [payment.bookingId] : [];
        }
      }

      if (!bookingIdsToUpdate || bookingIdsToUpdate.length === 0) {
        const bookingsWithRef = await db.select().from(bookings).where(eq(bookings.paystackReference, refToVerify));
        bookingIdsToUpdate = bookingsWithRef.map((b: any) => b.id);
      }

      for (const bid of bookingIdsToUpdate) {
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, bid)).limit(1);
        if (!booking) continue;
        if (booking.paymentStatus !== "paid") {
          await db.update(bookings).set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() }).where(eq(bookings.id, booking.id));
          await db.update(rooms).set({ status: "booked", updatedAt: new Date() }).where(eq(rooms.id, booking.roomId));
          console.log(`Updated booking id=${booking.id} to paid/confirmed and marked room id=${booking.roomId} as booked`);
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
        // Update all bookings related to this payment.
        let bookingIdsToUpdate: number[] = [];
        try {
          if (payment.bookingIds) {
            bookingIdsToUpdate = typeof payment.bookingIds === "string" ? JSON.parse(payment.bookingIds) : payment.bookingIds;
          } else if (payment.bookingId) {
            bookingIdsToUpdate = [payment.bookingId];
          }
        } catch (e) {
          bookingIdsToUpdate = payment.bookingId ? [payment.bookingId] : [];
        }

        if (!bookingIdsToUpdate || bookingIdsToUpdate.length === 0) {
          const bookingsWithRef = await db.select().from(bookings).where(eq(bookings.paystackReference, reference));
          bookingIdsToUpdate = bookingsWithRef.map((b: any) => b.id);
        }

        for (const bid of bookingIdsToUpdate) {
          const [booking] = await db.select().from(bookings).where(eq(bookings.id, bid)).limit(1);
          if (!booking) continue;
          await db.update(bookings).set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() }).where(eq(bookings.id, booking.id));
          await db.update(rooms).set({ status: "booked", updatedAt: new Date() }).where(eq(rooms.id, booking.roomId));
          console.log(`Webhook updated booking id=${booking.id} to paid/confirmed and marked room id=${booking.roomId} as booked`);
        }
        // If this payment is tied to an extension, update the extension and booking checkOut
        try {
          if (payment && payment.extensionId) {
            const [ext] = await db.select().from(extensions).where(eq(extensions.id, payment.extensionId)).limit(1);
            if (ext) {
              await db.update(extensions).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(extensions.id, ext.id));
              await db.update(bookings).set({ checkOut: ext.newCheckOut, updatedAt: new Date() }).where(eq(bookings.id, ext.bookingId));
              console.log(`Webhook marked extension id=${ext.id} paid and updated booking id=${ext.bookingId} checkOut to ${ext.newCheckOut}`);
            }
          }
        } catch (e) {
          console.warn("Webhook: failed to update extension:", e);
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
