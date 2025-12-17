import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InterestPopup from "@/components/InterestPopup";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    if (user) {
      // Check if we should show the interest popup (first time after login in this session)
      const hasShownPopup = sessionStorage.getItem("interestPopupShown");
      if (!hasShownPopup) {
        setShowInterestPopup(true);
        sessionStorage.setItem("interestPopupShown", "true");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handleClosePopup = () => {
    setShowInterestPopup(false);
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          // Don't navigate here - useEffect will handle showing popup and navigation
        }
      } else {
        if (!formData.fullName.trim()) {
          toast({
            title: "Name Required",
            description: "Please enter your full name.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "You can now login and book trips.",
          });
          // Don't navigate here - useEffect will handle showing popup and navigation
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="px-6 py-8 text-center bg-gradient-to-r from-primary to-accent">
              <h1 className="font-serif text-2xl font-bold text-primary-foreground">
                {isLogin ? "Welcome Back" : "Join GoBhraman"}
              </h1>
              <p className="text-primary-foreground/80 mt-2">
                {isLogin ? "Login to manage your bookings" : "Create an account to start your journey"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>

            {/* Toggle */}
            <div className="px-6 pb-6 text-center">
              <p className="text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  className="text-primary font-medium ml-2 hover:underline"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Sign up" : "Login"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Interest Popup */}
      <InterestPopup 
        isOpen={showInterestPopup} 
        onClose={handleClosePopup} 
      />
    </div>
  );
};

export default Auth;
