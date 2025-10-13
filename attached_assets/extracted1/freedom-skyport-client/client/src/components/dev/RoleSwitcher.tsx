import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

type Role = "owner" | "admin" | "instructor";

export function RoleSwitcher() {
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const stored = localStorage.getItem("dev_role_override");
    return (stored as Role) || "owner";
  });

  const handleRoleChange = (newRole: Role) => {
    localStorage.setItem("dev_role_override", newRole);
    setCurrentRole(newRole);
    // Force page reload to apply new role
    window.location.reload();
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-3 shadow-lg border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
          <RefreshCw className="h-4 w-4" />
          <span>Dev Role:</span>
        </div>
        <Select value={currentRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-32 h-8 bg-white dark:bg-gray-800" data-testid="select-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner" data-testid="role-option-owner">Owner</SelectItem>
            <SelectItem value="admin" data-testid="role-option-admin">Admin</SelectItem>
            <SelectItem value="instructor" data-testid="role-option-instructor">Instructor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
