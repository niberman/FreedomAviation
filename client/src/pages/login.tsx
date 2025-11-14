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
  const [location, setLocation] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, signUp, user } = useAuth();
  const { toast } = useToast();

  // Check URL params for action and set isRegister accordingly
  const [fromQuote, setFromQuote] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'register') {
      setIsRegister(true);
    }
    if (params.get('from') === 'quote') {
      setFromQuote(true);
    }
  }, []);

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
      
      // Trim the role to handle any whitespace issues
      const trimmedRole = data.role?.trim() || null;
      console.log('User role detected:', trimmedRole);
      
      // Redirect staff (admin, staff, or legacy cfi) to staff dashboard
      if (isStaffRole(trimmedRole)) {
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
      
      // Check for pending quote data
      const pendingQuoteStr = sessionStorage.getItem('pendingQuote');
      
      if (pendingQuoteStr) {
        try {
          const quoteData = JSON.parse(pendingQuoteStr);
          
          // Wait a moment for the user to be fully created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get the newly created user
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            // Save the quote
            await supabase.from("support_tickets").insert([{
              owner_id: userData.user.id,
              subject: "Pricing Quote Request",
              body: JSON.stringify({
                aircraft_class: quoteData.aircraft_class,
                monthly_hours: quoteData.monthly_hours,
                monthly_price: quoteData.monthly_price,
                source: "signup_flow",
              }),
              status: "open",
            }]);
            
            // Clear the pending quote
            sessionStorage.removeItem('pendingQuote');
            
            toast({
              title: "Account created!",
              description: "Your quote has been saved. Let's complete your profile...",
            });
          }
        } catch (quoteError) {
          console.error('Error saving pending quote:', quoteError);
          // Don't block the flow if quote saving fails
          toast({
            title: "Account created!",
            description: "Redirecting to complete your profile...",
          });
        }
      } else {
        toast({
          title: "Account created!",
          description: "Redirecting to complete your profile...",
        });
      }
      
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // User will be redirected to Google, then back to the app
    } catch (error: any) {
      setGoogleLoading(false);
      toast({
        variant: "destructive",
        title: "Google Sign-In failed",
        description: error.message || "Failed to sign in with Google",
      });
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
            {fromQuote && isRegister 
              ? "Create your account to save your quote" 
              : isRegister 
                ? "Create your account" 
                : "Sign in to your owner portal"}
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
            <Button type="submit" className="w-full" data-testid={isRegister ? "button-register" : "button-login"} disabled={loading || googleLoading}>
              {loading 
                ? (isRegister ? "Creating account..." : "Signing in...") 
                : (isRegister ? "Create Account" : "Sign In")
              }
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              data-testid="button-google-signin"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {googleLoading ? "Connecting to Google..." : "Sign in with Google"}
            </Button>
          </div>
          
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
