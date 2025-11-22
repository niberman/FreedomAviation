import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export function useAircraft() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['/api/aircraft', session?.access_token],
    queryFn: async () => {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const response = await fetch('/api/aircraft', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error fetching aircraft:', errorText);
        throw new Error(`Failed to fetch aircraft: ${response.status}`);
      }

      const data = await response.json();
      return data.aircraft || [];
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAircraftTable() {
  const { data: aircraft = [], ...rest } = useAircraft();

  const aircraftFull = aircraft.map((ac: any) => {
    const ownerRecord = ac.owner || null;
    const ownerName = ownerRecord?.full_name || ownerRecord?.email || null;

    return {
      id: ac.id,
      tailNumber: ac.tail_number,
      make: ac.make || 'N/A',
      model: ac.model || '',
      class: ac.class || 'Unknown',
      baseAirport: ac.base_location || 'KAPA',
      owner: ownerName || 'Unassigned',
      ownerId: ac.owner_id ?? null,
      ownerEmail: ownerRecord?.email ?? null,
    };
  });

  return { aircraftFull, ...rest };
}
