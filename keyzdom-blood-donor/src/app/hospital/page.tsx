"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useRequests } from "@/hooks/use-data";
import { motion } from "framer-motion";
import { LayoutDashboard, AlertTriangle, Clock, CheckCircle } from "lucide-react";

export default function HospitalDashboard() {
  return (
    <AuthGuard allowedRoles={["hospital_staff"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <HospitalContent />
        </main>
      </div>
    </AuthGuard>
  );
}

function HospitalContent() {
  const { data: requests, isLoading } = useRequests();

  const requestList = (requests as Array<{
    id: number;
    org_id: number;
    blood_type_needed: string;
    units_needed: number;
    urgency: string;
    status: string;
    expires_at: string;
    created_at: string;
  }>) || [];

  const openRequests = requestList.filter((r) => r.status === "open" || r.status === "in_progress");

  const urgencyColors: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive",
    high: "bg-warning/10 text-warning",
    normal: "bg-primary/10 text-primary",
  };

  const statusColors: Record<string, string> = {
    open: "bg-success/10 text-success",
    in_progress: "bg-warning/10 text-warning",
    fulfilled: "bg-primary/10 text-primary",
    expired: "bg-text-secondary/10 text-text-secondary",
    cancelled: "bg-text-secondary/10 text-text-secondary",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">Hospital Dashboard</h1>
        <p className="text-text-secondary">Manage blood requests and track donors</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-secondary">Active Requests</span>
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-primary">
            {openRequests.filter((r) => r.status === "open").length}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-secondary">In Progress</span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div className="text-3xl font-bold text-warning">
            {openRequests.filter((r) => r.status === "in_progress").length}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-secondary">Critical</span>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-3xl font-bold text-destructive">
            {openRequests.filter((r) => r.urgency === "critical").length}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-surface border border-border rounded-xl"
      >
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Blood Requests</h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-5 text-text-secondary text-sm">Loading requests...</div>
          ) : requestList.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-1">No active requests</h3>
              <p className="text-text-secondary">Create a new blood request to get started.</p>
            </div>
          ) : (
            requestList.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * i }}
                className="p-4 flex items-center justify-between hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {req.blood_type_needed}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {req.units_needed} units needed
                    </div>
                    <div className="text-sm text-text-secondary">
                      Expires: {new Date(req.expires_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyColors[req.urgency] || ""}`}>
                    {req.urgency}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status] || ""}`}>
                    {req.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
