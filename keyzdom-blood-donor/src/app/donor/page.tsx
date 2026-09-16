"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useDonorProfile, useMyMatches } from "@/hooks/use-data";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Heart, MapPin, Clock, CheckCircle, XCircle, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DonorDashboard() {
  return (
    <AuthGuard allowedRoles={["donor"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <DonorContent />
        </main>
      </div>
    </AuthGuard>
  );
}

function DonorContent() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const { data: profile, isLoading: profileLoading, error: profileError } = useDonorProfile();
  const { data: matches, isLoading: matchesLoading } = useMyMatches();

  useEffect(() => {
    if (profileError && !profileLoading) {
      router.push("/donor/setup");
    }
  }, [profileError, profileLoading, router]);

  const toggleAvailability = async () => {
    if (!profile) return;
    try {
      await api.patch(
        "/api/donors/availability",
        { is_available: !profile.is_available },
        token!
      );
      window.location.reload();
    } catch {}
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome, {user?.name}
        </h1>
        <p className="text-text-secondary">Manage your donations and respond to requests</p>
      </motion.div>

      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">Blood Type</span>
              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
            </div>
            <div className="text-3xl font-bold text-primary">{profile.blood_type}</div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">Status</span>
              {profile.is_available ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-text-secondary" />
              )}
            </div>
            <div className={`text-lg font-semibold ${profile.is_available ? "text-success" : "text-text-secondary"}`}>
              {profile.is_available ? "Available" : "Unavailable"}
            </div>
            <button
              onClick={toggleAvailability}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Toggle availability
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">Radius</span>
              <MapPin className="h-4 w-4 text-text-secondary" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{profile.max_radius_km} km</div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-border rounded-xl"
      >
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Active Alerts</h2>
        </div>
        <div className="p-5">
          {matchesLoading ? (
            <p className="text-text-secondary text-sm">Loading matches...</p>
          ) : !matches || (matches as Array<{ id: number }>).length === 0 ? (
            <p className="text-text-secondary text-sm">No active blood requests at the moment. We&apos;ll notify you when a match is found.</p>
          ) : (
            <div className="space-y-3">
              {(matches as Array<{
                id: number;
                request_id: number;
                distance_km: number | null;
                status: string;
                notified_at: string;
              }>).filter((m) => m.status === "notified").map((match) => (
                <MatchAlert key={match.id} match={match} />
              ))}
              {(matches as Array<{
                id: number;
                request_id: number;
                distance_km: number | null;
                status: string;
                notified_at: string;
              }>).filter((m) => m.status !== "notified").length > 0 && (
                <div className="pt-3 border-t border-border">
                  <h3 className="text-sm font-medium text-text-secondary mb-2">History</h3>
                  {(matches as Array<{
                    id: number;
                    request_id: number;
                    distance_km: number | null;
                    status: string;
                    notified_at: string;
                  }>).filter((m) => m.status !== "notified").map((match) => (
                    <div key={match.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-text-secondary">Request #{match.request_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        match.status === "accepted"
                          ? "bg-success/10 text-success"
                          : match.status === "declined"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                      }`}>
                        {match.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MatchAlert({ match }: { match: { id: number; request_id: number; distance_km: number | null } }) {
  const token = useAuthStore((s) => s.token);
  const [responding, setResponding] = useState(false);

  const respond = async (action: "accept" | "decline") => {
    setResponding(true);
    try {
      await api.post(`/api/matches/${match.id}/${action}`, {}, token!);
      window.location.reload();
    } catch {
      setResponding(false);
    }
  };

  return (
    <div className="bg-background border border-primary/30 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
            <span className="font-semibold text-text-primary">Blood Donation Request</span>
          </div>
          <p className="text-sm text-text-secondary">
            Request #{match.request_id}
            {match.distance_km && ` · ${match.distance_km} km away`}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary">
            <Clock className="h-3 w-3" />
            <span>Respond quickly to save a life</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => respond("accept")}
            disabled={responding}
            className="bg-success hover:bg-success/80 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={() => respond("decline")}
            disabled={responding}
            className="bg-surface border border-border hover:bg-destructive/10 text-text-primary px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}


