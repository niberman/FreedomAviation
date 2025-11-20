import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import logoImage from "@assets/falogo.png";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { updatePassword, session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Check for password recovery tokens in URL hash and process them
  useEffect(() => {
    // Supabase tokens come in the URL hash (e.g., #access_token=...&type=recovery)
    const hash = window.location.hash;
    console.log('[ResetPassword] Current hash:', hash ? 'Has recovery token' : 'No hash');
    console.log('[ResetPassword] Auth loading:', authLoading, 'Session:', session ? 'Present' : 'None');
    
    if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
      console.log('[ResetPassword] Recovery token found, waiting for Supabase to process...');
      
      // Force Supabase to process the hash by calling exchangeCodeForSession
      const processToken = async () => {
        try {
          // Extract the access token from the hash
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('[ResetPassword] Attempting to set session with tokens...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('[ResetPassword] Error setting session:', error);
              toast({
                variant: "destructive",
                title: "Invalid or expired link",
                description: error.message || "This password reset link is invalid or has expired.",
              });
              setTimeout(() => setLocation("/forgot-password"), 2000);
            } else if (data.session) {
              console.log('[ResetPassword] Session set successfully');
            }
          }
        } catch (err) {
          console.error('[ResetPassword] Error processing token:', err);
        }
      };
      
      // Try to process the token after a short delay
      setTimeout(processToken, 500);
      
      // Also set a timeout to check if session was established
      const timeout = setTimeout(() => {
        if (!session && !authLoading) {
          console.log('[ResetPassword] No session after 5 seconds - token likely invalid');
          toast({
            variant: "destructive",
            title: "Invalid or expired link",
            description: "This password reset link is invalid or has expired. Please request a new one.",
          });
          setTimeout(() => {
            setLocation("/forgot-password");
          }, 2000);
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    }

    // If no hash and no session after loading, the link is invalid
    if (!authLoading && !hash && !session) {
      console.log('[ResetPassword] No hash or session - invalid link');
      toast({
        variant: "destructive",
        title: "Invalid or expired link",
        description: "This password reset link is invalid or has expired. Please request a new one.",
      });
      // Redirect to forgot password page after a delay
      setTimeout(() => {
        setLocation("/forgot-password");
      }, 3000);
    }
  }, [session, authLoading, toast, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation password must match.",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      toast({
        title: "Session expired",
        description: "Your reset session has expired. Please request a new password reset link.",
        variant: "destructive",
      });
      setLocation("/forgot-password");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(newPassword);
      setSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Failed to update password",
        description: error.message || "An error occurred while updating your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logoImage} alt="Freedom Aviation" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => setLocation("/forgot-password")}
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logoImage} alt="Freedom Aviation" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully updated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Freedom Aviation" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={loading}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  disabled={loading}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

