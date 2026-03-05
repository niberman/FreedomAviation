import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiJson } from "@/lib/api-client";

export interface Client {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  created_at?: string;
  aircraft_count?: number;
}

export function useClients() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['/api/clients', session?.access_token],
    queryFn: async () => {
      const data = await apiJson<{ clients?: Client[] }>('/api/clients');
      return data.clients ?? [];
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
