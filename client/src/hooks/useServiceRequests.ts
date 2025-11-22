import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/auth-utils";
import { useToast } from "@/hooks/use-toast";

export function useServiceRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching service requests...');
        
        const res = await authenticatedFetch('/api/service-requests');
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({ 
            error: 'Network error',
            message: res.statusText 
          }));
          
          // Provide more helpful error messages
          if (res.status === 503) {
            throw new Error(err.message || 'Server configuration error. Please contact support.');
          } else if (res.status === 403) {
            throw new Error('You do not have permission to view service requests.');
          }
          
          throw new Error(err.message || `Failed to load service requests (${res.status})`);
        }
        
        const json = await res.json();
        console.log('✅ Fetched service requests:', json.serviceRequests?.length || 0);
        return json.serviceRequests || [];
      } catch (error) {
        console.error('❌ Error fetching service requests:', error);
        throw error;
      }
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string, status: "pending" | "in_progress" | "completed" }) => {
      const res = await authenticatedFetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: (_, { status }) => {
      toast({ 
        title: 'Status updated', 
        description: `Service request status changed to ${status}` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
    },
    onError: (error: Error) => {
      console.error('Error updating service request status:', error);
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  return { 
    ...query, 
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending
  };
}

