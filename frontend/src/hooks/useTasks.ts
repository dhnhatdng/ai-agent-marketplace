import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => axios.get(`${API}/api/tasks/${id}`).then(r => r.data.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      return data?.status === "pending" || data?.status === "processing" ? 2000 : false;
    },
  });
}

export function useClientTasks(clientAddress?: string) {
  return useQuery({
    queryKey: ["tasks", "client", clientAddress],
    queryFn: () => axios.get(`${API}/api/tasks?client=${clientAddress}`).then(r => r.data.data),
    enabled: !!clientAddress,
    refetchInterval: 5000,
  });
}

export function useCreateTask() {
  return useMutation({
    mutationFn: (data: any) => axios.post(`${API}/api/tasks`, data).then(r => r.data.data),
  });
}
