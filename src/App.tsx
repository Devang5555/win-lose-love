import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";

// Route-level code splitting — heavy pages loaded on demand
const Trips = lazy(() => import("./pages/Trips"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Admin = lazy(() => import("./pages/Admin"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Destinations = lazy(() => import("./pages/Destinations"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const SearchPage = lazy(() => import("./pages/Search"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const Policy = lazy(() => import("./pages/Policy"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Stories = lazy(() => import("./pages/Stories"));
const InvoicePage = lazy(() => import("./pages/Invoice"));
const Profile = lazy(() => import("./pages/Profile"));
const SissuItinerary = lazy(() => import("./pages/SissuItinerary"));
const GoaItinerary = lazy(() => import("./pages/GoaItinerary"));
const ManaliItinerary = lazy(() => import("./pages/ManaliItinerary"));
const RishikeshItinerary = lazy(() => import("./pages/RishikeshItinerary"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — avoid unnecessary refetches
      refetchOnWindowFocus: false,
    },
  },
});

const RouteLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/trips/:tripId" element={<TripDetail />} />
              <Route path="/trip/:tripId" element={<TripDetail />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/destinations/:slug" element={<DestinationDetail />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/booking-success/:bookingId" element={<BookingSuccess />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="/cancellation" element={<Policy />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/invoice/:bookingId" element={<InvoicePage />} />
              <Route path="/itinerary/delhi-to-sissu" element={<SissuItinerary />} />
              <Route path="/itinerary/goa-beach-bliss" element={<GoaItinerary />} />
              <Route path="/itinerary/manali-snow-adventure" element={<ManaliItinerary />} />
              <Route path="/itinerary/rishikesh-adventure" element={<RishikeshItinerary />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
