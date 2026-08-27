import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg font-heading">W</span>
              </div>
              <div>
                <p className="text-white font-heading text-lg">Williams Yesumo</p>
                <p className="text-accent text-xs tracking-widest uppercase">Lodge</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              A premium lodge offering comfort and elegance in the heart of Ghana. Experience warm hospitality and modern amenities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-heading text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/rooms", label: "Our Rooms" },
                { href: "/booking", label: "Book a Room" },
                { href: "/login", label: "Sign In" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Room Categories */}
          <div>
            <h4 className="text-white font-heading text-lg mb-4">Room Categories</h4>
            <ul className="space-y-2">
              <li className="text-sm text-white/60">Queen Suite — GH₵ 450/night</li>
              <li className="text-sm text-white/60">Deluxe Room — GH₵ 300/night</li>
              <li className="text-sm text-white/60">Standard Room — GH₵ 250/night</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-heading text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/60">
                <svg className="w-4 h-4 mt-0.5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ghana, West Africa
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <svg className="w-4 h-4 mt-0.5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@williamsyesumo.com
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <svg className="w-4 h-4 mt-0.5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.98.68l1.13 3.38a1 1 0 01-.17.91l-1.55 1.55a11.002 11.002 0 005.06 5.06l1.55-1.55a1 1 0 01.91-.17l3.38 1.13a1 1 0 01.68.98V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                </svg>
                +233 20 000 0000
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Williams Yesumo Lodge. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Payments powered by Paystack
          </p>
        </div>
      </div>
    </footer>
  );
}
