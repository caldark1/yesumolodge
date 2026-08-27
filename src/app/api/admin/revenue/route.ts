import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period");

    const paidBookings = await db.select().from(bookings).where(eq(bookings.paymentStatus, "paid"));

    let filteredBookings = paidBookings;

    if (period === "today") {
      const today = format(new Date(), "yyyy-MM-dd");
      filteredBookings = paidBookings.filter((b) => {
        if (!b.createdAt) return false;
        return format(new Date(b.createdAt), "yyyy-MM-dd") === today;
      });
    } else if (period === "month") {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
      filteredBookings = paidBookings.filter((b) => {
        if (!b.createdAt) return false;
        const d = format(new Date(b.createdAt), "yyyy-MM-dd");
        return d >= monthStart && d <= monthEnd;
      });
    } else if (startDate && endDate) {
      filteredBookings = paidBookings.filter((b) => {
        if (!b.createdAt) return false;
        const d = format(new Date(b.createdAt), "yyyy-MM-dd");
        return d >= startDate && d <= endDate;
      });
    }

    const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.amount, 0);
    const onlineRevenue = filteredBookings.filter((b) => b.source === "online").reduce((sum, b) => sum + b.amount, 0);
    const walkInRevenue = filteredBookings.filter((b) => b.source === "walk_in").reduce((sum, b) => sum + b.amount, 0);

    // Monthly breakdown
    const monthBreakdown = [];
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const mStart = format(startOfMonth(month), "yyyy-MM-dd");
      const mEnd = format(endOfMonth(month), "yyyy-MM-dd");
      const monthBookings = paidBookings.filter((b) => {
        if (!b.createdAt) return false;
        const d = format(new Date(b.createdAt), "yyyy-MM-dd");
        return d >= mStart && d <= mEnd;
      });
      monthBreakdown.push({
        month: format(month, "MMM yyyy"),
        revenue: monthBookings.reduce((sum, b) => sum + b.amount, 0),
        onlineRevenue: monthBookings.filter((b) => b.source === "online").reduce((sum, b) => sum + b.amount, 0),
        walkInRevenue: monthBookings.filter((b) => b.source === "walk_in").reduce((sum, b) => sum + b.amount, 0),
        bookings: monthBookings.length,
        onlineBookings: monthBookings.filter((b) => b.source === "online").length,
        walkInBookings: monthBookings.filter((b) => b.source === "walk_in").length,
      });
    }

    return NextResponse.json({
      totalRevenue,
      onlineRevenue,
      walkInRevenue,
      bookingCount: filteredBookings.length,
      onlineCount: filteredBookings.filter((b) => b.source === "online").length,
      walkInCount: filteredBookings.filter((b) => b.source === "walk_in").length,
      monthlyBreakdown: monthBreakdown,
    });
  } catch (error) {
    console.error("Revenue error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
