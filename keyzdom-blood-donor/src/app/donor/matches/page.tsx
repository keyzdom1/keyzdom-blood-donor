"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useMyMatches } from "@/hooks/use-data";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { HandHeart, Clock, CheckCircle, XCircle } from "lucide-react";

export default function DonorMatchesPage() {
  return (
    <AuthGuard allowedRoles={["donor"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <MatchesContent />
        </main>
      </div>
    </AuthGuard>
  );
}

function MatchesContent() {
  const token = useAuthStore((s) => s.token);
  const { data: matches, isLoading } = useMyMatches();

  const respond = async (matchId: number, action: "accept" | "decline") => {
    try {
      await api.post(`/api/matches/${matchId}/${action}`, {}, token!);
      window.location.reload();
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading matches...</div>
      </div>
    );
  }

  const matchList = (matches as Array<{
    id: number;
    request_id: number;
    distance_km: number | null;
    status: string;
    notified_at: string;
    responded_at: string | null;
  }>) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">My Matches</h1>
        <p className="text-text-secondary">View all your blood donation matches</p>
      </motion.div>

      {matchList.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <HandHeart className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-1">No matches yet</h3>
          <p className="text-text-secondary">When a hospital needs your blood type, you&apos;ll be matched here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matchList.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-primary">Request #{match.request_id}</span>
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
                  <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                    {match.distance_km && <span>{match.distance_km} km away</span>}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(match.notified_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {match.responded_at && (
                    <p className="text-xs text-text-secondary mt-1">
                      Responded: {new Date(match.responded_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {match.status === "notified" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(match.id, "accept")}
                      className="bg-success hover:bg-success/80 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => respond(match.id, "decline")}
                      className="bg-surface border border-border hover:bg-destructive/10 text-text-primary px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
