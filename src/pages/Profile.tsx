import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfileData({
        full_name: data.full_name || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
      });
    } else {
      setProfileData((prev) => ({ ...prev, email: user.email || "" }));
    }
    setLoadingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileData.full_name,
        phone: profileData.phone,
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Updated", description: "Your details have been saved." });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword.length < 6) {
      toast({ title: "Too Short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
      setPasswords({ newPassword: "", confirmPassword: "" });
    }
    setChangingPassword(false);
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta title="My Profile — GoBhraman" description="Manage your profile and account settings." />
      <Navbar />

      <main className="pt-20 md:pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your personal details and security</p>
          </div>

          {/* Personal Details Card */}
          <section className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-lg font-bold text-foreground">Personal Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-1.5">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input id="email" value={profileData.email} disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </section>

          {/* Change Password Card */}
          <section className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-lg font-bold text-foreground">Change Password</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="flex items-center gap-2 mb-1.5">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-1.5">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwords.newPassword}
              variant="outline"
              className="w-full sm:w-auto gap-2"
            >
              <Lock className="w-4 h-4" />
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
