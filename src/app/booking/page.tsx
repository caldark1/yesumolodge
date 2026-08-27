"use client";

import { Suspense } from "react";

// The actual booking page component is lazy-loaded because it uses useSearchParams
// which requires a Suspense boundary
import BookingPageContent from "./BookingPageContent";

export default function BookingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
