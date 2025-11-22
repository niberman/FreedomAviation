import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export function useClients() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['/api/clients', session?.access_token],
    queryFn: async () => {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }
      
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch clients: ${errorText}`);
      }

      const data = await response.json();
      return data.clients || [];
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

