"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.user && setUser(data.user))
      .catch(() => {});

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-charcoal shadow-lg" : "bg-charcoal/95 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg font-heading">W</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-heading text-lg leading-tight">Williams Yesumo</p>
              <p className="text-accent text-xs tracking-widest uppercase">Lodge</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: "Home" },
              { href: "/rooms", label: "Rooms" },
              { href: "/booking", label: "Book Now" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-accent bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (user.role === "admin" || user.role === "reception") && (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                Dashboard
              </Link>
            )}

            <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-white/70 text-sm">
                    {user.firstName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-dark transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-white"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-charcoal-light border-t border-white/10 animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {[
              { href: "/", label: "Home" },
              { href: "/rooms", label: "Rooms" },
              { href: "/booking", label: "Book Now" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm ${
                  isActive(link.href) ? "text-accent bg-white/10" : "text-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (user.role === "admin" || user.role === "reception") && (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-sm text-white/80">
                Dashboard
              </Link>
            )}

            <div className="pt-2 border-t border-white/10">
              {user ? (
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-white/80">
                  Logout ({user.firstName})
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-white/80">
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-accent">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
