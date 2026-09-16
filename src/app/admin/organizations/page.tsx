"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { Building2, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface OrgInfo { id: number; name: string; type: string; verified: boolean; }

export default function AdminOrgsPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6"><OrgsContent /></main>
      </div>
    </AuthGuard>
  );
}

function OrgsContent() {
  const token = useAuthStore((s) => s.token);
  const [pendingOrgs, setPendingOrgs] = useState<OrgInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = () => {
    if (!token) return;
    setLoading(true);
    api.get("/api/admin/organizations", token).then((data) => { setPendingOrgs(data as OrgInfo[]); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, [token]);

  const verify = async (orgId: number) => { if (!token) return; await api.post(`/api/admin/organizations/${orgId}/verify`, {}, token); fetchPending(); };
  const reject = async (orgId: number) => { if (!token) return; await api.post(`/api/admin/organizations/${orgId}/reject`, {}, token); fetchPending(); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-text-primary">Organization Verification</h1>
        <p className="text-text-secondary">Review and verify hospital/blood bank registrations</p>
      </div>
      <div className="bg-surface border border-border rounded-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Pending Verifications ({pendingOrgs.length})</h2>
        </div>
        {loading ? <div className="p-12 text-center text-text-secondary">Loading...</div>
        : pendingOrgs.length === 0 ? (
          <div className="p-12 text-center"><CheckCircle className="h-12 w-12 text-success mx-auto mb-4" /><h3 className="text-lg font-medium text-text-primary mb-1">All caught up!</h3><p className="text-text-secondary">No organizations pending verification.</p></div>
        ) : <div className="divide-y divide-border">{pendingOrgs.map((org, i) => (
          <div key={org.id} className="p-5 flex items-center justify-between animate-fade-in" style={{ animationDelay: `${0.05 * i}s` }}>
            <div><div className="font-medium text-text-primary">{org.name}</div><div className="text-sm text-text-secondary capitalize">{org.type.replace("_", " ")}</div></div>
            <div className="flex gap-2">
              <button onClick={() => verify(org.id)} className="bg-success hover:bg-success/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"><CheckCircle className="h-4 w-4" />Verify</button>
              <button onClick={() => reject(org.id)} className="bg-surface border border-border hover:bg-destructive/10 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"><XCircle className="h-4 w-4" />Reject</button>
            </div>
          </div>
        ))}</div>}
      </div>
    </div>
  );
}
