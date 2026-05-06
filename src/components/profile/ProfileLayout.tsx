import { ReactNode, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  /** Show a back button to /profile (sub-pages). Default true. */
  showBack?: boolean;
}

const ProfileLayout = ({ title, description, children, showBack = true }: Props) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta title={`${title} — GoBhraman`} description={description || title} />
      <Navbar />
      <main className="pt-20 md:pt-24 pb-24 md:pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {showBack && (
            <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to Profile
            </Link>
          )}
          <header className="mb-6">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </header>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileLayout;
