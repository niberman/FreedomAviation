'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

export function NotificationPreferencesCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle>Notifications</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="setting-notifications" className="text-sm font-medium">
            Maintenance notifications
          </Label>
          <Switch id="setting-notifications" disabled />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="setting-billing" className="text-sm font-medium">
            Auto-email billing summaries
          </Label>
          <Switch id="setting-billing" disabled />
        </div>
        <p className="text-xs text-muted-foreground">
          These toggles are placeholders. Settings will be enabled in a future update.
        </p>
      </CardContent>
    </Card>
  );
}
