import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding";

interface OnboardingAccountStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function OnboardingAccountStep({ data, updateData, onNext }: OnboardingAccountStepProps) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState(data.email || "");
  const [password, setPassword] = useState(data.password || "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(data.fullName || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const validateForm = () => {
    if (!email || !password || !fullName) {
      setError("Please fill in all required fields");
      return false;
    }
    
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    return true;
  };
  
  const handleCreateAccount = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Create the account
      await signUp(email, password, { 
        full_name: fullName.trim(),
        phone: phone.trim() || undefined
      });
      
      // Update onboarding data
      updateData({
        email,
        password,
        fullName,
        phone
      });
      
      // Sign in immediately after signup for smooth flow
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        throw signInError;
      }
      
      // Update user profile with phone if provided
      if (phone && signInData.user) {
        await supabase
          .from("user_profiles")
          .update({ phone: phone.trim() })
          .eq("id", signInData.user.id);
      }
      
      toast({
        title: "Account created!",
        description: "Your Freedom Aviation account has been created successfully.",
      });
      
      // Proceed to next step
      onNext();
    } catch (err: any) {
      console.error("Signup error:", err);
      
      if (err.message?.includes("already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const formatPhone = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
        </div>
        
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="pilot@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            You'll use this to sign in to your account
          </p>
        </div>
        
        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={handlePhoneChange}
            disabled={loading}
            maxLength={14}
          />
          <p className="text-sm text-muted-foreground">
            Optional - for important updates and notifications
          </p>
        </div>
        
        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
          <p className="text-sm text-muted-foreground">
            Must be at least 6 characters
          </p>
        </div>
        
        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
        </div>
      </div>
      
      {/* Terms and Privacy Notice */}
      <div className="text-sm text-muted-foreground">
        By creating an account, you agree to Freedom Aviation's Terms of Service and Privacy Policy.
      </div>
      
      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleCreateAccount}
        disabled={loading || !email || !password || !fullName}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Account & Continue"
        )}
      </Button>
    </div>
  );
}
