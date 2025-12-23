import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { NotificationPreferences, NotificationPreferencesInsert, NotificationPreferencesUpdate } from "@/lib/types/database";

export function NotificationPreferencesCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Load existing preferences
  useEffect(() => {
    if (!user?.id) return;

    const loadPreferences = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        if (data) {
          setPreferences(data);
        } else {
          // Create default preferences
          const defaultPrefs: NotificationPreferencesInsert = {
            user_id: user.id,
            receive_service_requests: true,
            receive_flight_instruction_requests: true,
            receive_maintenance_alerts: true,
            receive_emergency_requests: true,
            email_enabled: true
          };

          const { data: newPrefs, error: insertError } = await supabase
            .from('notification_preferences')
            .insert(defaultPrefs)
            .select()
            .single();

          if (insertError) throw insertError;
          setPreferences(newPrefs);
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id]);

  const handleToggle = (field: keyof NotificationPreferences) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [field]: !preferences[field]
    });
  };

  const handleSave = async () => {
    if (!preferences || !user?.id) return;

    setSaving(true);
    try {
      const updateData: NotificationPreferencesUpdate = {
        receive_service_requests: preferences.receive_service_requests,
        receive_flight_instruction_requests: preferences.receive_flight_instruction_requests,
        receive_maintenance_alerts: preferences.receive_maintenance_alerts,
        receive_emergency_requests: preferences.receive_emergency_requests,
        email_enabled: preferences.email_enabled,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notification Preferences</CardTitle>
        <CardDescription>
          Choose which types of notifications you want to receive via email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all email notifications
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={() => handleToggle('email_enabled')}
            />
          </div>

          {preferences.email_enabled && (
            <>
              <div className="border-t pt-4" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="service-requests">Service Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    New pre-flight, maintenance, and service requests
                  </p>
                </div>
                <Switch
                  id="service-requests"
                  checked={preferences.receive_service_requests}
                  onCheckedChange={() => handleToggle('receive_service_requests')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="instruction-requests">Flight Instruction Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    New flight training and instruction requests
                  </p>
                </div>
                <Switch
                  id="instruction-requests"
                  checked={preferences.receive_flight_instruction_requests}
                  onCheckedChange={() => handleToggle('receive_flight_instruction_requests')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-alerts">Maintenance Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Upcoming maintenance due dates and overdue items
                  </p>
                </div>
                <Switch
                  id="maintenance-alerts"
                  checked={preferences.receive_maintenance_alerts}
                  onCheckedChange={() => handleToggle('receive_maintenance_alerts')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emergency-requests">Emergency Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Urgent and high-priority requests requiring immediate attention
                  </p>
                </div>
                <Switch
                  id="emergency-requests"
                  checked={preferences.receive_emergency_requests}
                  onCheckedChange={() => handleToggle('receive_emergency_requests')}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
