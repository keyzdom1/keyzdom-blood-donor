"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Users, Flag, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface DonorInfo {
  user_id: number;
  name: string;
  contact: string;
  blood_type: string;
  is_available: boolean;
  last_donation_date: string | null;
}

export default function AdminDonorsPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <DonorsContent />
        </main>
      </div>
    </AuthGuard>
  );
}

function DonorsContent() {
  const token = useAuthStore((s) => s.token);
  const [donors, setDonors] = useState<DonorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDonors = () => {
    if (!token) return;
    setLoading(true);
    api.get("/api/admin/donors", token).then((data) => {
      setDonors(data as DonorInfo[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchDonors(); }, [token]);

  const toggleFlag = async (donorId: number, isAvailable: boolean) => {
    if (!token) return;
    const endpoint = isAvailable ? "unflag" : "flag";
    await api.patch(`/api/admin/donors/${donorId}/${endpoint}`, {}, token);
    fetchDonors();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">Donor Management</h1>
        <p className="text-text-secondary">View and moderate registered donors</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">
              {donors.length} Registered Donors
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-secondary">Loading donors...</div>
        ) : donors.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">No donors found</div>
        ) : (
          <div className="divide-y divide-border">
            {donors.map((donor, i) => (
              <motion.div
                key={donor.user_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.02 * i }}
                className="p-4 flex items-center justify-between hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {donor.blood_type}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">{donor.name}</div>
                    <div className="text-sm text-text-secondary">{donor.contact}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${donor.is_available ? "text-success" : "text-text-secondary"}`}>
                      {donor.is_available ? "Available" : "Unavailable"}
                    </div>
                    {donor.last_donation_date && (
                      <div className="text-xs text-text-secondary">
                        Last donation: {new Date(donor.last_donation_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFlag(donor.user_id, donor.is_available)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      donor.is_available
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-success/10 text-success hover:bg-success/20"
                    }`}
                  >
                    {donor.is_available ? (
                      <><Flag className="h-3.5 w-3.5 inline mr-1" />Flag</>
                    ) : (
                      <><CheckCircle className="h-3.5 w-3.5 inline mr-1" />Unflag</>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
