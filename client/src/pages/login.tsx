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

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
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
        console.error('Error fetching user profile:', error);
        // Default to dashboard if we can't fetch the role
        return "/dashboard";
      }
      
      // Redirect staff (admin or cfi) to staff dashboard
      if (data?.role === 'admin' || data?.role === 'cfi') {
        return "/staff";
      }
      
      // Regular users go to owner dashboard
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
      
      // Get the current user to check their role
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // Determine redirect path based on user role
        const redirectPath = await getRedirectPath(currentUser.id);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Freedom Aviation",
        });
        setLocation(redirectPath);
      } else {
        // Fallback if user is not available immediately
        setLocation("/dashboard");
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Freedom Aviation" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Freedom Aviation</CardTitle>
          <CardDescription>Sign in to your owner portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              />
            </div>
            <Button type="submit" className="w-full" data-testid="button-login" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setLocation("/forgot-password")}
              className="text-sm text-muted-foreground hover:text-primary underline"
              data-testid="button-forgot-password"
            >
              Forgot your password?
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
