import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, extensions, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, newCheckOut, note, createdBy, paid } = body;
    if (!bookingId || !newCheckOut) return NextResponse.json({ error: "bookingId and newCheckOut are required" }, { status: 400 });

    const [b] = await db.select().from(bookings).where(eq(bookings.id, parseInt(bookingId))).limit(1);
    if (!b) return NextResponse.json({ error: `Booking ${bookingId} not found` }, { status: 404 });

    const oldCheck = new Date(b.checkOut);
    const newCheck = new Date(newCheckOut);
    const extraNights = daysBetween(oldCheck, newCheck);
    if (extraNights <= 0) return NextResponse.json({ error: "newCheckOut must be after current checkOut" }, { status: 400 });

    const originalNights = Math.max(daysBetween(new Date(b.checkIn), oldCheck), 1);
    const nightlyRate = Math.round((b.amount || 0) / originalNights) || 0;
    const amount = nightlyRate * extraNights;

    const [ins] = await db.insert(extensions).values([
      {
        bookingId: b.id,
        groupBookingId: b.groupBookingId || b.bookingId,
        oldCheckOut: oldCheck,
        newCheckOut: newCheck,
        extraNights,
        amount,
        note: note || null,
        createdBy: createdBy ? parseInt(createdBy) : null,
      } as any,
    ] as any).returning();

    // Immediately update the booking's checkOut to reflect the requested extension
    try {
      const newCheckStr = newCheck.toISOString().split("T")[0];
      await db.update(bookings).set({ checkOut: newCheckStr, updatedAt: new Date() }).where(eq(bookings.id, b.id));
    } catch (e) {
      console.warn("Failed to update booking checkOut after extension creation", e);
    }

    // If receptionist took cash (paid === true), create a manual payment record and mark extension paid
    if (paid) {
      try {
        const reference = `CASH-EXT-${ins.id}-${Date.now()}`;
        try {
          await db.insert(payments).values({ bookingId: b.id, extensionId: ins.id, reference, amount, status: "success", paystackResponse: { manual: true, method: "cash" } as any }).returning();
        } catch (e) {
          // fallback if extensionId column not present
          await db.insert(payments).values({ bookingId: b.id, reference, amount, status: "success", paystackResponse: { manual: true, method: "cash" } as any }).returning();
        }
        await db.update(extensions).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(extensions.id, ins.id));
        // Also add extension amount to booking.amount and mark booking as paid so revenue reflects the cash collected
        try {
          const newAmount = (b.amount || 0) + amount;
          await db.update(bookings).set({ amount: newAmount, paymentStatus: "paid", updatedAt: new Date() }).where(eq(bookings.id, b.id));
        } catch (e) {
          console.warn("Failed to update booking amount/paymentStatus after cash extension", e);
        }
      } catch (e) {
        console.warn("Failed to create manual cash payment for extension", e);
      }
    }

    return NextResponse.json({ extension: ins });
  } catch (error) {
    console.error("Create extension error:", error);
    const message = error instanceof Error ? error.message : "Failed to create extension";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await db.select().from(extensions).orderBy(desc(extensions.createdAt)).limit(200);
    return NextResponse.json({ extensions: rows });
  } catch (error) {
    console.error("List extensions error:", error);
    return NextResponse.json({ error: "Failed to list extensions" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;
    if (!id) return NextResponse.json({ error: "extension id is required" }, { status: 400 });

    const [ext] = await db.select().from(extensions).where(eq(extensions.id, parseInt(id))).limit(1);
    if (!ext) return NextResponse.json({ error: `Extension ${id} not found` }, { status: 404 });

    if (action === "markPaid") {
      if (ext.paymentStatus === "paid") return NextResponse.json({ error: "Extension already marked paid" }, { status: 400 });

      // Create a manual payment record and mark extension paid
      const reference = `MANUAL-EXT-${ext.id}-${Date.now()}`;
      try {
        await db.insert(payments).values({ bookingId: ext.bookingId, extensionId: ext.id, reference, amount: ext.amount, status: "success", paystackResponse: { manual: true } as any }).returning();
      } catch (e) {
        // If payments table doesn't accept extensionId yet, insert legacy record
        await db.insert(payments).values({ bookingId: ext.bookingId, reference, amount: ext.amount, status: "success", paystackResponse: { manual: true } as any }).returning();
      }

      await db.update(extensions).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(extensions.id, ext.id));
      await db.update(bookings).set({ checkOut: ext.newCheckOut, updatedAt: new Date() }).where(eq(bookings.id, ext.bookingId));

      return NextResponse.json({ success: true, reference });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Extensions PATCH error:", error);
    return NextResponse.json({ error: "Failed to update extension" }, { status: 500 });
  }
}
