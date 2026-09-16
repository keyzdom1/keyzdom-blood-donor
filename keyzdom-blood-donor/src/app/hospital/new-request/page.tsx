"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function NewRequestPage() {
  return (
    <AuthGuard allowedRoles={["hospital_staff"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <NewRequestForm />
        </main>
      </div>
    </AuthGuard>
  );
}

function NewRequestForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [bloodType, setBloodType] = useState("O+");
  const [units, setUnits] = useState("1");
  const [urgency, setUrgency] = useState("normal");
  const [hoursUntilExpiry, setHoursUntilExpiry] = useState("24");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const expiresAt = new Date(Date.now() + parseInt(hoursUntilExpiry) * 3600000).toISOString();
      await api.post(
        "/api/requests",
        {
          org_id: 1,
          blood_type_needed: bloodType,
          units_needed: parseInt(units),
          urgency,
          expires_at: expiresAt,
        },
        token!
      );
      setSuccess(true);
      setTimeout(() => router.push("/hospital"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">Create Blood Request</h1>
        <p className="text-text-secondary">Post an urgent request for compatible donors</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 space-y-5"
      >
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">{error}</div>
        )}
        {success && (
          <div className="bg-success/10 text-success text-sm rounded-lg p-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Request created! Donors are being notified...
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Blood Type Needed</label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBloodType(type)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  bloodType === type
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-text-primary hover:border-primary/50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Units Needed</label>
            <input
              type="number"
              min="1"
              max="50"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Expires In (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={hoursUntilExpiry}
              onChange={(e) => setHoursUntilExpiry(e.target.value)}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Urgency Level</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "normal", label: "Normal", color: "border-success text-success" },
              { value: "high", label: "High", color: "border-warning text-warning" },
              { value: "critical", label: "Critical", color: "border-destructive text-destructive" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUrgency(opt.value)}
                className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                  urgency === opt.value
                    ? `${opt.color} bg-current/10`
                    : "border-border text-text-secondary hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : success ? "Request Created!" : "Send Request to Donors"}
        </button>
      </motion.form>
    </div>
  );
}
