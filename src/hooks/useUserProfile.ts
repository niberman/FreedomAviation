import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import type { UserProfile, UserProfileUpdate } from "@shared/database-types";

export const userProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

/** Full user profile with CRUD and role flags */
export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userProfileQuery = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const role = userProfileQuery.data?.role;
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff' || role === 'ops' || role === 'founder';
  const isCfi = role === 'cfi';
  const canSeeAllInvoices = isAdmin || isStaff;

  const updateUserProfile = useMutation({
    mutationFn: async (updateData: Partial<UserProfileFormData>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const validated = userProfileSchema.partial().parse(updateData);

      const updatePayload: UserProfileUpdate = {};
      if (validated.full_name !== undefined) {
        updatePayload.full_name = validated.full_name ?? undefined;
      }
      if (validated.phone !== undefined) {
        updatePayload.phone = validated.phone ?? undefined;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updatePayload)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
    },
  });

  return {
    ...userProfileQuery,
    userProfile: userProfileQuery.data,
    role,
    isAdmin,
    isStaff,
    isCfi,
    canSeeAllInvoices,
    updateUserProfile,
  };
}

/** Lightweight role-only query when you only need role flags (same data, same cache key) */
export function useUserRole() {
  const profile = useUserProfile();
  return {
    role: profile.role,
    isAdmin: profile.isAdmin,
    isStaff: profile.isStaff,
    isCfi: profile.isCfi,
    canSeeAllInvoices: profile.canSeeAllInvoices,
    isLoading: profile.isLoading,
    isError: profile.isError,
    error: profile.error,
  };
}
