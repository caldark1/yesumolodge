import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Williams Yesumo Lodge | Premium Hotel in Ghana",
  description:
    "Experience comfort and elegance at Williams Yesumo Lodge. Premium rooms with modern amenities in Ghana. Book your stay online today.",
  keywords: "hotel, lodge, Ghana, accommodation, booking, Williams Yesumo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream text-charcoal antialiased">{children}</body>
    </html>
  );
}
