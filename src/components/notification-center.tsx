'use client';

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  UserPlus,
  Wrench,
  DollarSign,
  Calendar,
  Plane,
  Trash2,
  BellOff
} from "lucide-react";

interface Notification {
  id: string;
  user_id: string;
  type: "service_request" | "maintenance_due" | "invoice" | "client_joined" | "flight_log" | "general";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  metadata?: Record<string, any>;
}

const NOTIFICATION_ICONS = {
  service_request: Wrench,
  maintenance_due: AlertCircle,
  invoice: DollarSign,
  client_joined: UserPlus,
  flight_log: Plane,
  general: Info,
};

export function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Check if notifications table exists
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkTableExists = async () => {
      if (!user) return;
      
      // Check if table exists by attempting a count query
      const { error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .limit(0);
      
      if (error?.code === "42P01") {
        // Table doesn't exist - disable component
        console.log("Notifications table not found - feature disabled");
        setTableExists(false);
      } else {
        setTableExists(true);
      }
    };
    
    checkTableExists();
  }, [user]);
  
  // Return null if table doesn't exist (feature not yet enabled)
  if (tableExists === false) {
    return null;
  }

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) {
        if (error.code === "42P01") {
          // Table doesn't exist yet
          return [];
        }
        console.warn("Error fetching notifications:", error);
        return [];
      }
      
      return data as Notification[];
    },
    enabled: !!user && tableExists === true,
    refetchInterval: tableExists === true ? 30000 : false, // Only refetch if table exists
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq("id", notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
        description: "Your notification inbox is now clear.",
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "All notifications cleared",
        description: "Your notification history has been cleared.",
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getNotificationIcon = (type: Notification["type"]) => {
    const Icon = NOTIFICATION_ICONS[type] || Info;
    return <Icon className="h-4 w-4" />;
  };

  const getRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {notifications.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => clearAllMutation.mutate()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground">
                  You'll be notified about important updates here.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="unread" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                  <TabsTrigger value="unread">
                    Unread ({unreadCount})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    All ({notifications.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="unread" className="m-0">
                  <ScrollArea className="h-[400px]">
                    {unreadNotifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No unread notifications
                      </div>
                    ) : (
                      <div className="divide-y">
                        {unreadNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onRead={() => markAsReadMutation.mutate(notification.id)}
                            onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="all" className="m-0">
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={() => markAsReadMutation.mutate(notification.id)}
                          onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}

function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Info;
  
  return (
    <div
      className={`p-4 hover:bg-muted/50 transition-colors ${
        !notification.is_read ? "bg-muted/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          notification.type === "maintenance_due" ? "bg-amber-100 text-amber-700" :
          notification.type === "invoice" ? "bg-green-100 text-green-700" :
          notification.type === "service_request" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">{notification.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getRelativeTime(notification.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!notification.is_read && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRead}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getRelativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}


