"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useAdminOverview } from "@/hooks/use-data";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  HandHeart,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Overview {
  total_donors: number;
  total_organizations: number;
  active_requests: number;
  total_matches: number;
  fulfilled_matches: number;
  pending_verifications: number;
}

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <AdminContent />
        </main>
      </div>
    </AuthGuard>
  );
}

function AdminContent() {
  const token = useAuthStore((s) => s.token);
  const { data: overview, isLoading } = useAdminOverview() as { data: Overview | undefined; isLoading: boolean };

  const stats = overview
    ? [
        { label: "Total Donors", value: overview.total_donors, icon: Users, color: "text-primary" },
        { label: "Organizations", value: overview.total_organizations, icon: Building2, color: "text-success" },
        { label: "Active Requests", value: overview.active_requests, icon: ClipboardList, color: "text-warning" },
        { label: "Total Matches", value: overview.total_matches, icon: HandHeart, color: "text-primary" },
        { label: "Fulfilled", value: overview.fulfilled_matches, icon: CheckCircle, color: "text-success" },
        { label: "Pending Verification", value: overview.pending_verifications, icon: AlertTriangle, color: "text-warning" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-text-secondary">System overview and management</p>
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-border rounded w-20 mb-3" />
              <div className="h-8 bg-border rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-secondary">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickActions token={token} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <SystemHealth token={token} />
        </motion.div>
      </div>
    </div>
  );
}

function QuickActions({ token }: { token: string | null }) {
  const [pendingOrgs, setPendingOrgs] = useState<Array<{ id: number; name: string; type: string }>>([]);

  useEffect(() => {
    if (token) {
      api.get("/api/admin/organizations", token).then((data) => {
        setPendingOrgs(data as Array<{ id: number; name: string; type: string }>);
      }).catch(() => {});
    }
  }, [token]);

  const verifyOrg = async (orgId: number) => {
    if (!token) return;
    await api.post(`/api/admin/organizations/${orgId}/verify`, {}, token);
    setPendingOrgs((prev) => prev.filter((o) => o.id !== orgId));
  };

  return (
    <div className="bg-surface border border-border rounded-xl">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">Pending Verifications</h2>
      </div>
      <div className="divide-y divide-border">
        {pendingOrgs.length === 0 ? (
          <div className="p-5 text-center text-text-secondary text-sm">No pending verifications</div>
        ) : (
          pendingOrgs.map((org) => (
            <div key={org.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">{org.name}</div>
                <div className="text-sm text-text-secondary">{org.type}</div>
              </div>
              <button
                onClick={() => verifyOrg(org.id)}
                className="bg-success hover:bg-success/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Verify
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SystemHealth({ token }: { token: string | null }) {
  const [health, setHealth] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (token) {
      api.get("/api/admin/system-health", token).then((data) => {
        setHealth(data as Record<string, string>);
      }).catch(() => {});
    }
  }, [token]);

  return (
    <div className="bg-surface border border-border rounded-xl">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">System Health</h2>
      </div>
      <div className="p-5 space-y-3">
        {!health ? (
          <div className="text-text-secondary text-sm">Loading...</div>
        ) : (
          <>
            {["database", "redis", "celery_workers"].map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary capitalize">{key.replace("_", " ")}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  health[key] === "healthy"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {health[key]}
                </span>
              </div>
            ))}
            {health.timestamp && (
              <div className="text-xs text-text-secondary pt-2 border-t border-border">
                Last checked: {new Date(health.timestamp).toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
