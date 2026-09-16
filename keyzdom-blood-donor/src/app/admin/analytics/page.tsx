"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

interface Analytics {
  total_requests: number;
  requests_by_status: Record<string, number>;
  requests_by_urgency: Record<string, number>;
  total_matches: number;
  matches_by_status: Record<string, number>;
  avg_match_distance_km: number | null;
  donor_availability_rate: number;
  fulfillment_rate: number;
}

export default function AdminAnalyticsPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6"><AnalyticsContent /></main>
      </div>
    </AuthGuard>
  );
}

function AnalyticsContent() {
  const token = useAuthStore((s) => s.token);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) api.get("/api/admin/analytics", token).then((data) => { setAnalytics(data as Analytics); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-text-secondary">Loading analytics...</div></div>;
  if (!analytics) return <div className="text-center text-text-secondary py-12">Failed to load analytics</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary">Platform performance and insights</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: analytics.total_requests, color: "text-primary" },
          { label: "Total Matches", value: analytics.total_matches, color: "text-success" },
          { label: "Fulfillment Rate", value: `${analytics.fulfillment_rate}%`, color: "text-success" },
          { label: "Avg Distance", value: analytics.avg_match_distance_km ? `${analytics.avg_match_distance_km} km` : "N/A", color: "text-warning" },
        ].map((stat, i) => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="text-sm text-text-secondary mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="p-5 border-b border-border"><h2 className="text-lg font-semibold text-text-primary">Requests by Status</h2></div>
          <div className="p-5 space-y-3">
            {Object.entries(analytics.requests_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary capitalize">{status.replace("_", " ")}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-border rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${analytics.total_requests > 0 ? (count / analytics.total_requests) * 100 : 0}%` }} /></div>
                  <span className="text-sm font-medium text-text-primary w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          <div className="p-5 border-b border-border"><h2 className="text-lg font-semibold text-text-primary">Requests by Urgency</h2></div>
          <div className="p-5 space-y-3">
            {Object.entries(analytics.requests_by_urgency).map(([urgency, count]) => {
              const colors: Record<string, string> = { critical: "bg-destructive", high: "bg-warning", normal: "bg-success" };
              return (
                <div key={urgency} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary capitalize">{urgency}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-border rounded-full overflow-hidden"><div className={`h-full ${colors[urgency] || "bg-primary"} rounded-full transition-all`} style={{ width: `${analytics.total_requests > 0 ? (count / analytics.total_requests) * 100 : 0}%` }} /></div>
                    <span className="text-sm font-medium text-text-primary w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="p-5 border-b border-border"><h2 className="text-lg font-semibold text-text-primary">Match Outcomes</h2></div>
          <div className="p-5 space-y-3">
            {Object.entries(analytics.matches_by_status).map(([status, count]) => {
              const colors: Record<string, string> = { accepted: "text-success", declined: "text-destructive", notified: "text-warning" };
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary capitalize">{status}</span>
                  <span className={`text-lg font-bold ${colors[status] || "text-text-primary"}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
          <div className="p-5 border-b border-border"><h2 className="text-lg font-semibold text-text-primary">Donor Availability</h2></div>
          <div className="p-5 flex flex-col items-center justify-center py-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${(analytics.donor_availability_rate / 100) * 314} 314`} className="text-primary" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-primary">{analytics.donor_availability_rate}%</span></div>
            </div>
            <p className="text-sm text-text-secondary mt-3">of donors are available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
