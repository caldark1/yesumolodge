import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, rooms, users } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { updateRoomStatuses } from "@/lib/room-utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "reception")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await updateRoomStatuses();

    // Room statistics
    const allRooms = await db.select().from(rooms);
    const totalRooms = allRooms.length;
    const availableRooms = allRooms.filter((r) => r.status === "available").length;
    const bookedRooms = allRooms.filter((r) => r.status === "booked").length;
    const maintenanceRooms = allRooms.filter((r) => r.status === "maintenance").length;

    const queen = allRooms.filter((r) => r.category === "queen");
    const deluxe = allRooms.filter((r) => r.category === "deluxe");
    const standard = allRooms.filter((r) => r.category === "standard");

    // Booking statistics
    const allBookings = await db.select().from(bookings);
    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter((b) => b.status === "confirmed").length;
    const pendingBookings = allBookings.filter((b) => b.status === "pending").length;
    const checkedInBookings = allBookings.filter((b) => b.status === "checked_in").length;

    // Revenue - all time
    const paidBookings = allBookings.filter((b) => b.paymentStatus === "paid");
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);

    // This month's revenue
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
    const thisMonthPaid = paidBookings.filter((b) => {
      if (!b.createdAt) return false;
      const d = format(new Date(b.createdAt), "yyyy-MM-dd");
      return d >= monthStart && d <= monthEnd;
    });
    const thisMonthRevenue = thisMonthPaid.reduce((sum, b) => sum + b.amount, 0);

    // Revenue by source
    const onlineRevenue = paidBookings.filter((b) => b.source === "online").reduce((sum, b) => sum + b.amount, 0);
    const walkInRevenue = paidBookings.filter((b) => b.source === "walk_in").reduce((sum, b) => sum + b.amount, 0);
    const onlineBookingsCount = allBookings.filter((b) => b.source === "online").length;
    const walkInBookingsCount = allBookings.filter((b) => b.source === "walk_in").length;

    // Staff count
    const allUsers = await db.select().from(users);
    const staffCount = allUsers.filter((u) => u.role === "admin" || u.role === "reception").length;

    return NextResponse.json({
      rooms: {
        total: totalRooms,
        available: availableRooms,
        booked: bookedRooms,
        maintenance: maintenanceRooms,
        queen: {
          total: queen.length,
          available: queen.filter((r) => r.status === "available").length,
          booked: queen.filter((r) => r.status === "booked").length,
        },
        deluxe: {
          total: deluxe.length,
          available: deluxe.filter((r) => r.status === "available").length,
          booked: deluxe.filter((r) => r.status === "booked").length,
        },
        standard: {
          total: standard.length,
          available: standard.filter((r) => r.status === "available").length,
          booked: standard.filter((r) => r.status === "booked").length,
        },
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        checkedIn: checkedInBookings,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        online: onlineRevenue,
        walkIn: walkInRevenue,
      },
      bookingSources: {
        online: onlineBookingsCount,
        walkIn: walkInBookingsCount,
      },
      staffCount,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
