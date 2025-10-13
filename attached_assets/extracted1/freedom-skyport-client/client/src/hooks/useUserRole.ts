import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type UserRole = "owner" | "admin" | "instructor";

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [`/api/users/${user?.id}/roles`],
    enabled: !!user?.id,
    select: (data: string[]) => {
      // API returns array of role strings like ["owner", "admin", "instructor"]
      if (!data || data.length === 0) return null;
      
      // In development, check for role override
      if (!import.meta.env.PROD) {
        const override = localStorage.getItem("dev_role_override");
        if (override && ["owner", "admin", "instructor"].includes(override)) {
          return override as UserRole;
        }
      }
      
      // Prioritize admin > instructor > owner if user has multiple roles
      if (data.includes("admin")) return "admin" as UserRole;
      if (data.includes("instructor")) return "instructor" as UserRole;
      if (data.includes("owner")) return "owner" as UserRole;
      
      return null;
    },
  });
}
