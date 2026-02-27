import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export function useClients() {
  const { session } = useAuth();

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/ce595c44-18a7-46d2-b583-275de660c288',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'99c487'},body:JSON.stringify({sessionId:'99c487',location:'useClients.ts:render',message:'useClients hook rendered',data:{hasSession:!!session,hasAccessToken:!!session?.access_token},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion

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

