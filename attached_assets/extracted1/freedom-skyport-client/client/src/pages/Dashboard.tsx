import { useUserRole } from "@/hooks/useUserRole";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import OwnerDashboard from "@/components/dashboards/OwnerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function Dashboard() {
  const { data: role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {role === "owner" && <OwnerDashboard />}
      {role === "admin" && <AdminDashboard />}
      {role === "instructor" && (
        <Layout>
          <div className="container mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6" />
                  Instructor Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Instructor dashboard coming soon. This will include student management,
                  flight scheduling, and training records.
                </p>
              </CardContent>
            </Card>
          </div>
        </Layout>
      )}
      {!role && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No role assigned. Please contact an administrator.</p>
            <Button onClick={() => window.location.href = '/auth'}>Sign Out</Button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
