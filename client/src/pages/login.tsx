import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { isStaffRole } from "@/lib/roles";
import logoImage from "@assets/falogo.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  // Helper function to determine redirect based on user role
  const getRedirectPath = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile in login:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        
        // Check if it's a permission/RLS error
        const isPermissionError = error.message?.includes('permission') || 
                                  error.message?.includes('RLS') ||
                                  error.code === 'PGRST301' ||
                                  error.code === '42501';
        
        if (isPermissionError) {
          console.error('Permission/RLS error when fetching profile. User may not have access to their own profile.');
          console.error('This could indicate an RLS policy issue. Check that "Users can view own profile" policy exists.');
        }
        
        // Default to dashboard if we can't fetch the role
        // The StaffProtectedRoute will handle redirecting if needed
        return "/dashboard";
      }
      
      if (!data) {
        console.warn('User profile not found for user:', userId);
        console.warn('Profile may be created by trigger. Defaulting to dashboard.');
        // Default to dashboard - StaffProtectedRoute will check and redirect if needed
        return "/dashboard";
      }
      
      console.log('User role detected:', data.role);
      
      // Redirect staff (admin, staff, or legacy cfi) to staff dashboard
      if (isStaffRole(data.role)) {
        console.log('Redirecting staff user to /staff');
        return "/staff";
      }
      
      // Regular users go to owner dashboard
      console.log('Redirecting owner user to /dashboard');
      return "/dashboard";
    } catch (error) {
      console.error('Error checking user role:', error);
      return "/dashboard";
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      getRedirectPath(user.id).then((path) => {
        setLocation(path);
      });
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(email, password);
      
      // Get user directly from Supabase after sign in (most reliable)
      const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        console.error('Error getting user after sign in:', getUserError);
        // Fallback: let useEffect handle redirect when user becomes available
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Freedom Aviation",
        });
        return;
      }
      
      if (currentUser) {
        // Determine redirect path based on user role
        const redirectPath = await getRedirectPath(currentUser.id);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Freedom Aviation",
        });
        setLocation(redirectPath);
      }
      // If user is not available, the useEffect will handle redirect when it becomes available
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: error.message || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Passwords do not match",
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    
    try {
      await signUp(email, password, fullName.trim() ? { full_name: fullName.trim() } : undefined);
      
      toast({
        title: "Account created!",
        description: "Redirecting to complete your profile...",
      });
      
      // Redirect to onboarding flow
      setTimeout(() => {
        setLocation("/onboarding");
      }, 1000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Failed to create account. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Freedom Aviation" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Freedom Aviation</CardTitle>
          <CardDescription>
            {isRegister ? "Create your account" : "Sign in to your owner portal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  data-testid="input-full-name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="pilot@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
                required
                minLength={6}
              />
            </div>
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button type="submit" className="w-full" data-testid={isRegister ? "button-register" : "button-login"} disabled={loading}>
              {loading 
                ? (isRegister ? "Creating account..." : "Signing in...") 
                : (isRegister ? "Create Account" : "Sign In")
              }
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setPassword("");
                setConfirmPassword("");
                setFullName("");
              }}
              className="text-sm text-muted-foreground hover:text-primary underline"
              data-testid="button-toggle-auth"
            >
              {isRegister 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Register"}
            </button>
            {!isRegister && (
              <div>
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-sm text-muted-foreground hover:text-primary underline"
                  data-testid="button-forgot-password"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
