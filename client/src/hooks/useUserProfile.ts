import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export function useUserProfile() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const role = query.data?.role;
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff' || role === 'ops' || role === 'founder';
  const isCfi = role === 'cfi';
  const canSeeAllInvoices = isAdmin || isStaff;

  return { ...query, role, isAdmin, isStaff, isCfi, canSeeAllInvoices };
}

