import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import type { UserProfile, UserProfileUpdate } from "@/lib/types/database";

// Zod schema for user profile validation
export const userProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user profile
  const userProfile = useQuery({
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
  });

  // Update user profile mutation
  const updateUserProfile = useMutation({
    mutationFn: async (updateData: Partial<UserProfileFormData>) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Validate input
      const validated = userProfileSchema.partial().parse(updateData);

      // Prepare update data - only include fields that are provided
      const updatePayload: UserProfileUpdate = {};
      if (validated.full_name !== undefined) {
        updatePayload.full_name = validated.full_name;
      }
      if (validated.phone !== undefined) {
        updatePayload.phone = validated.phone;
      }

      // Note: Email updates should be handled through Supabase Auth, not the profile table
      // The email in user_profiles is typically synced from auth.users

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
    userProfile: userProfile.data,
    isLoading: userProfile.isLoading,
    isError: userProfile.isError,
    error: userProfile.error,
    updateUserProfile,
  };
}

