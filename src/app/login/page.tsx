"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Small delay to ensure cookie is set before redirect
      await new Promise((r) => setTimeout(r, 100));
      if (data.user.role === "admin" || data.user.role === "reception") {
        router.push("/dashboard");
      } else {
        router.push("/booking");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-charcoal to-primary-dark flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl font-heading">W</span>
          </div>
          <h1 className="text-3xl font-heading text-white mb-1">Welcome Back</h1>
          <p className="text-white/50 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-charcoal mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-slate mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary-dark font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
