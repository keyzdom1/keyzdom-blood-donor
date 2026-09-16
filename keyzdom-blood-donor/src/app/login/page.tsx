"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{
        access_token: string;
        user: { id: number; role: "donor" | "hospital_staff" | "admin"; name: string; contact: string };
      }>("/api/auth/login", { contact, password });
      setAuth(data.user, data.access_token);
      if (data.user.role === "donor") router.push("/donor");
      else if (data.user.role === "hospital_staff") router.push("/hospital");
      else router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
            <span className="text-2xl font-bold text-text-primary">Keyzdom</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
          <p className="text-text-secondary mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email or Phone</label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Enter your password" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-text-secondary text-sm mt-6">
          Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
