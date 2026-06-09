import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => axios.get(`${API}/api/agents`).then(r => r.data.data),
    refetchInterval: 30_000,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ["agent", id],
    queryFn: () => axios.get(`${API}/api/agents/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useAgentsByOwner(address?: string) {
  return useQuery({
    queryKey: ["agents", "owner", address],
    queryFn: () => axios.get(`${API}/api/agents/owner/${address}`).then(r => r.data.data),
    enabled: !!address,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => axios.post(`${API}/api/agents`, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}

export function useAgentReviews(id: string) {
  return useQuery({
    queryKey: ["agent-reviews", id],
    queryFn: () => axios.get(`${API}/api/agents/${id}/reviews`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useOwnerEarnings(address?: string) {
  return useQuery({
    queryKey: ["owner-earnings", address],
    queryFn: () => axios.get(`${API}/api/agents/owner/${address}/earnings`).then(r => r.data.data),
    enabled: !!address,
  });
}
