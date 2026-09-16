"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export function useDonorProfile() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["donor", "me"],
    queryFn: () => api.get("/api/donors/me", token!),
    enabled: !!token,
  });
}

export function useMyMatches() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["matches"],
    queryFn: () => api.get("/api/matches", token!),
    enabled: !!token,
  });
}

export function useRequests() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["requests"],
    queryFn: () => api.get("/api/requests", token!),
    enabled: !!token,
  });
}

export function useAdminOverview() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api.get("/api/admin/overview", token!),
    enabled: !!token,
  });
}
