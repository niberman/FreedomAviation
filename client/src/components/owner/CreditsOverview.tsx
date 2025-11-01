import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CreditsOverview() {
  const { user } = useAuth();

  const { data: membership } = useQuery({
    queryKey: ["membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select(`
          *,
          pricing_packages (
            name,
            credits_multiplier
          )
        `)
        .eq("owner_id", user.id)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: credits } = useQuery({
    queryKey: ["service-credits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("service_credits")
        .select(`
          *
        `)
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!membership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Credits</CardTitle>
          <CardDescription>No active membership</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact admin to set up your membership and service credits.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Credits</CardTitle>
        <CardDescription>
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <span>Membership Package:</span>
            <Badge variant="secondary">{membership.tier}</Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credits && credits.length > 0 ? (
          <div className="space-y-4">
            {credits.map((credit: any) => {
              return (
                <div
                  key={credit.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{credit.service_name || 'Service'}</p>
                    <p className="text-xs text-muted-foreground">
                      {credit.category}
                      {credit.can_rollover && " • Rollover enabled"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {credit.credits_available || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No service credits configured yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
