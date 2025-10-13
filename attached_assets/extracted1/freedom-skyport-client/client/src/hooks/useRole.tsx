import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

type Role = "owner" | "admin" | "instructor";

export function useRole() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ["/api/users", user?.id, "roles"],
    enabled: Boolean(user?.id),
  });

  // In development, check for role override
  const getActiveRole = (): Role | null => {
    if (!import.meta.env.PROD) {
      const override = localStorage.getItem("dev_role_override");
      if (override && ["owner", "admin", "instructor"].includes(override)) {
        return override as Role;
      }
    }

    // Production logic: admin takes precedence
    if (roles.includes("admin")) return "admin";
    if (roles.includes("instructor")) return "instructor";
    if (roles.includes("owner")) return "owner";
    return null;
  };

  const activeRole = getActiveRole();
  const isDev = !import.meta.env.PROD;
  const hasDevOverride = isDev && localStorage.getItem("dev_role_override") !== null;

  return {
    roles,
    activeRole,
    isLoading,
    isDev,
    hasDevOverride,
    hasRole: (role: Role) => roles.includes(role),
    isAdmin: activeRole === "admin",
    isOwner: activeRole === "owner",
    isInstructor: activeRole === "instructor",
  };
}
