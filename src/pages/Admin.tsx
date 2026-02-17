import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, Users, Phone, Calendar, Wallet, UserCheck, PhoneCall, XOctagon, MessageCircle, Layers, MapPin, Image, AlertTriangle, ExternalLink, RefreshCw, Download, BarChart3, Star, Ban, DollarSign, History, Shield, Activity, IndianRupee, FileText, Send, Gift, Trash2, ArchiveX, Plane, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BatchManagement from "@/components/admin/BatchManagement";
import TripManagement from "@/components/admin/TripManagement";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdvancedAnalytics from "@/components/admin/AdvancedAnalytics";
import ReviewsManagement from "@/components/admin/ReviewsManagement";
import AuditLogs from "@/components/admin/AuditLogs";
import BlogEditor from "@/components/admin/BlogEditor";
import FinancialReconciliation from "@/components/admin/FinancialReconciliation";
import WhatsAppBroadcast from "@/components/admin/WhatsAppBroadcast";
import LeadsCaptureManagement from "@/components/admin/LeadsCaptureManagement";
import DepartureOps from "@/components/admin/DepartureOps";
import { usePermissions, getRoleLabel } from "@/hooks/usePermissions";
import { 
  openWhatsAppAdvanceVerified, 
  openWhatsAppFullyPaid,
  getWhatsAppUserLink,
  BookingDetails 
} from "@/lib/whatsapp";

interface Booking {
  id: string;
  user_id: string | null;
  trip_id: string;
  batch_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  pickup_location: string | null;
  num_travelers: number;
  total_amount: number;
  advance_paid: number;
  payment_status: string;
  booking_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  advance_screenshot_url: string | null;
  remaining_screenshot_url: string | null;
  remaining_payment_status: string | null;
  remaining_payment_uploaded_at: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
}

interface Refund {
  id: string;
  booking_id: string;
  amount: number;
  refund_status: string;
  reason: string | null;
  processed_at: string | null;
  created_at: string;
}

interface InterestedUser {
  id: string;
  user_id: string | null;
  trip_id: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_month: string | null;
  message: string | null;
  created_at: string;
}

interface Batch {
  id: string;
  trip_id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  seats_booked: number;
  available_seats: number | null;
  status: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, roles, loading } = useAuth();
  const { can, canAny, isStaffRole } = usePermissions(roles);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [filteredInterested, setFilteredInterested] = useState<InterestedUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [analyticsTrips, setAnalyticsTrips] = useState<{ trip_id: string; trip_name: string; destination_id: string | null }[]>([]);
  const [analyticsDestinations, setAnalyticsDestinations] = useState<{ id: string; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: string; status: string; source: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [advanceScreenshotUrl, setAdvanceScreenshotUrl] = useState<string | null>(null);
  const [remainingScreenshotUrl, setRemainingScreenshotUrl] = useState<string | null>(null);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<"soft" | "force" | null>(null);
  const [cancelRefundAmount, setCancelRefundAmount] = useState("0");

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isStaffRole))) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isAdmin, isStaffRole, loading, navigate, toast]);

  useEffect(() => {
    if (user && (isAdmin || isStaffRole)) {
      fetchData();
    }
  }, [user, isAdmin, isStaffRole]);

  useEffect(() => {
    let filtered = bookings;
    
    // Filter soft-deleted unless toggle is on
    if (!showDeleted) {
      filtered = filtered.filter((b) => !b.is_deleted);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.full_name.toLowerCase().includes(term) ||
          b.email.toLowerCase().includes(term) ||
          b.phone.includes(term) ||
          b.trip_id.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.booking_status === statusFilter);
    }

    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((b) => b.payment_status === paymentStatusFilter);
    }
    
    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, paymentStatusFilter, showDeleted]);

  useEffect(() => {
    let filtered = interestedUsers;
    
    if (leadSearchTerm) {
      const term = leadSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(term) ||
          u.phone.includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.trip_id.toLowerCase().includes(term)
      );
    }
    
    setFilteredInterested(filtered);
  }, [interestedUsers, leadSearchTerm]);

  // Fetch screenshot URLs when booking is selected
  useEffect(() => {
    const fetchScreenshots = async () => {
      if (!selectedBooking) {
        setAdvanceScreenshotUrl(null);
        setRemainingScreenshotUrl(null);
        return;
      }

      setLoadingScreenshots(true);
      
      try {
        // Fetch advance screenshot
        if (selectedBooking.advance_screenshot_url) {
          const { data } = await supabase.storage
            .from('payment-screenshots')
            .createSignedUrl(selectedBooking.advance_screenshot_url, 3600);
          if (data?.signedUrl) {
            setAdvanceScreenshotUrl(data.signedUrl);
          }
        }

        // Fetch remaining payment screenshot
        if (selectedBooking.remaining_screenshot_url) {
          const { data } = await supabase.storage
            .from('payment-screenshots')
            .createSignedUrl(selectedBooking.remaining_screenshot_url, 3600);
          if (data?.signedUrl) {
            setRemainingScreenshotUrl(data.signedUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching screenshots:', error);
      } finally {
        setLoadingScreenshots(false);
      }
    };

    fetchScreenshots();
  }, [selectedBooking]);

  const fetchData = async () => {
    const [bookingsRes, interestedRes, batchesRes, tripsRes, destsRes, refundsRes, paymentsRes, leadsRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("interested_users").select("*").order("created_at", { ascending: false }),
      supabase.from("batches").select("*").order("start_date", { ascending: true }),
      supabase.from("trips").select("trip_id, trip_name, destination_id"),
      supabase.from("destinations").select("id, name"),
      supabase.from("refunds").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, status, source"),
    ]);

    if (bookingsRes.error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } else {
      setBookings(bookingsRes.data || []);
    }

    if (interestedRes.error) {
      toast({
        title: "Error",
        description: "Failed to fetch interested users",
        variant: "destructive",
      });
    } else {
      setInterestedUsers(interestedRes.data || []);
    }

    if (!batchesRes.error) {
      setBatches(batchesRes.data || []);
    }

    if (!tripsRes.error) {
      setAnalyticsTrips(tripsRes.data || []);
    }
    if (!destsRes.error) {
      setAnalyticsDestinations(destsRes.data || []);
    }

    if (!refundsRes.error) {
      setRefunds(refundsRes.data || []);
    }

    if (!paymentsRes.error) {
      setPayments(paymentsRes.data || []);
    }

    if (!leadsRes.error) {
      setLeads(leadsRes.data || []);
    }

    setLoadingData(false);
  };

  const updateBookingStatus = async (bookingId: string, bookingStatus: string, paymentStatus?: string) => {
    const updateData: Record<string, string> = { booking_status: bookingStatus };
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Booking ${bookingStatus === "confirmed" ? "confirmed" : "updated"}`,
      });
      fetchData();
      setSelectedBooking(null);
    }
  };

  // Verify advance payment with audit logging
  const verifyAdvancePayment = async (booking: Booking) => {
    if (!user) return;
    if (!advanceScreenshotUrl) {
      toast({ title: "Error", description: "No advance payment screenshot uploaded. Cannot verify.", variant: "destructive" });
      return;
    }
    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_status: "confirmed",
          payment_status: "advance_verified",
          verified_by_admin_id: user.id,
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Audit log
      await supabase.rpc("create_audit_log", {
        p_user_id: user.id,
        p_action_type: "advance_verified",
        p_entity_type: "booking",
        p_entity_id: booking.id,
        p_metadata: { trip_id: booking.trip_id, advance_paid: booking.advance_paid, customer: booking.full_name },
      });

      toast({ title: "Advance Verified", description: "Advance payment has been verified and booking confirmed." });

      // Notify user via WhatsApp
      const bookingDetails: BookingDetails = {
        userName: booking.full_name,
        tripName: booking.trip_id,
        advanceAmount: booking.advance_paid,
        remainingAmount: booking.total_amount - booking.advance_paid,
        bookingId: booking.id,
        phone: booking.phone,
      };
      openWhatsAppAdvanceVerified(booking.phone, bookingDetails);

      fetchData();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error verifying advance:", error);
      toast({ title: "Error", description: "Failed to verify advance payment", variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject advance payment
  const rejectAdvancePayment = async (booking: Booking, reason: string) => {
    if (!reason.trim() || !user) return;
    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          payment_status: "advance_pending",
          rejection_reason: reason,
        })
        .eq("id", booking.id);

      if (error) throw error;

      await supabase.rpc("create_audit_log", {
        p_user_id: user.id,
        p_action_type: "advance_rejected",
        p_entity_type: "booking",
        p_entity_id: booking.id,
        p_metadata: { reason, trip_id: booking.trip_id },
      });

      toast({ title: "Advance Rejected", description: "User has been notified to re-upload." });

      const message = `❌ Advance Payment Rejected\n\nHi ${booking.full_name},\n\nYour advance payment for *${booking.trip_id}* could not be verified.\n\nReason: ${reason}\n\nPlease re-upload the correct payment proof.\n\n– Team GoBhraman`;
      window.open(getWhatsAppUserLink(booking.phone, message), '_blank');

      fetchData();
      setSelectedBooking(null);
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting advance:", error);
      toast({ title: "Error", description: "Failed to reject advance payment", variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  // Send balance reminder via WhatsApp
  const sendBalanceReminder = async (booking: Booking) => {
    if (!user) return;
    setProcessingAction(true);
    try {
      const balanceAmount = booking.total_amount - booking.advance_paid;
      const batch = batches.find(b => b.id === booking.batch_id);
      const dueDate = batch ? new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'your trip date';

      const message = `⏰ Payment Reminder – GoBhraman\n\nHi ${booking.full_name},\n\nYour remaining ₹${balanceAmount.toLocaleString()} for *${booking.trip_id}* is pending. Please complete payment before *${dueDate}*.\n\nUpload your payment proof from your dashboard:\n${window.location.origin}/my-bookings\n\n– Team GoBhraman`;

      // Log the reminder
      await supabase.from("payment_reminders").insert({
        booking_id: booking.id,
        sent_by: user.id,
        channel: "whatsapp",
        message: message,
      });

      // Audit log
      await supabase.rpc("create_audit_log", {
        p_user_id: user.id,
        p_action_type: "reminder_sent",
        p_entity_type: "booking",
        p_entity_id: booking.id,
        p_metadata: { channel: "whatsapp", balance_amount: balanceAmount, trip_id: booking.trip_id },
      });

      window.open(getWhatsAppUserLink(booking.phone, message), '_blank');

      toast({ title: "Reminder Sent", description: "Balance payment reminder sent via WhatsApp." });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({ title: "Error", description: "Failed to send reminder", variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  // Verify remaining payment
  const verifyRemainingPayment = async (booking: Booking) => {
    if (!user) return;
    // Prevent double-marking
    if (booking.payment_status === "fully_paid") {
      toast({ title: "Already Paid", description: "This booking is already marked as fully paid.", variant: "destructive" });
      return;
    }
    setProcessingAction(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          remaining_payment_status: "verified",
          remaining_payment_verified_at: new Date().toISOString(),
          verified_by_admin_id: user.id,
          payment_status: "fully_paid",
          rejection_reason: null
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Audit log
      await supabase.rpc("create_audit_log", {
        p_user_id: user.id,
        p_action_type: "balance_verified",
        p_entity_type: "booking",
        p_entity_id: booking.id,
        p_metadata: { trip_id: booking.trip_id, balance_amount: booking.total_amount - booking.advance_paid, customer: booking.full_name },
      });

      toast({
        title: "Payment Verified",
        description: "Remaining payment has been verified. Booking is now fully paid.",
      });

      // Open WhatsApp to notify user
      const bookingDetails: BookingDetails = {
        userName: booking.full_name,
        tripName: booking.trip_id,
        advanceAmount: booking.advance_paid,
        remainingAmount: booking.total_amount - booking.advance_paid,
        bookingId: booking.id,
        phone: booking.phone
      };
      openWhatsAppFullyPaid(booking.phone, bookingDetails);

      fetchData();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject remaining payment
  const rejectRemainingPayment = async (booking: Booking, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessingAction(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          remaining_payment_status: "rejected",
          rejection_reason: reason,
          payment_status: "advance_verified" // Revert to advance_verified so user can re-upload
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast({
        title: "Payment Rejected",
        description: "User has been notified to re-upload payment proof.",
      });

      // Open WhatsApp to notify user about rejection
      const message = `❌ Payment Verification Failed

Hi ${booking.full_name},

The payment proof uploaded for *${booking.trip_id}* could not be verified.

Reason: ${reason}

Please re-upload the correct payment proof from your dashboard.

– Team GoBhraman`;

      window.open(getWhatsAppUserLink(booking.phone, message), '_blank');

      fetchData();
      setSelectedBooking(null);
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Cancel booking with seat release via RPC
  const cancelBooking = async (booking: Booking, reason: string, refundAmount: number) => {
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a cancellation reason", variant: "destructive" });
      return;
    }

    // 48h policy check - warn if trip starts within 48 hours
    if (booking.batch_id) {
      const batch = batches.find(b => b.id === booking.batch_id);
      if (batch) {
        const hoursUntilStart = (new Date(batch.start_date).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilStart < 48 && hoursUntilStart > 0) {
          if (!confirm("⚠️ Trip starts within 48 hours! This requires admin override. Proceed with cancellation?")) {
            return;
          }
        }
      }
    }

    setProcessingAction(true);
    try {
      const { error } = await supabase.rpc("cancel_booking_with_seat_release", {
        p_booking_id: booking.id,
        p_reason: reason,
        p_refund_amount: refundAmount,
      });

      if (error) throw error;

      toast({ title: "Booking Cancelled", description: "Seats released and booking cancelled successfully." });

      // Notify user via WhatsApp
      const message = `❌ Booking Cancelled

Hi ${booking.full_name},

Your booking for *${booking.trip_id}* has been cancelled.

Reason: ${reason}
${refundAmount > 0 ? `\nRefund Amount: ₹${refundAmount.toLocaleString()} (processing)` : ''}

For queries, please contact us.

– Team GoBhraman`;
      window.open(`https://wa.me/${booking.phone}?text=${encodeURIComponent(message)}`, '_blank');

      fetchData();
      setSelectedBooking(null);
      setShowCancelModal(false);
      setCancelReason("");
      setCancelRefundAmount("0");
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast({ title: "Error", description: error.message || "Failed to cancel booking", variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  // Update refund status
  const updateRefundStatus = async (refundId: string, status: string) => {
    const updateData: Record<string, any> = { refund_status: status };
    if (status === "processed") {
      updateData.processed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("refunds").update(updateData).eq("id", refundId);
    if (error) {
      toast({ title: "Error", description: "Failed to update refund status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Refund marked as ${status}` });
      if (status === "processed") {
        const refund = refunds.find(r => r.id === refundId);
        if (refund) {
          await supabase.from("bookings").update({ booking_status: "refunded" }).eq("id", refund.booking_id);
          // Audit log
          if (user) {
            await supabase.from("audit_logs").insert({
              user_id: user.id,
              action_type: "refund_processed",
              entity_type: "refund",
              entity_id: refundId,
              metadata: { booking_id: refund.booking_id, amount: refund.amount, reason: refund.reason },
            });
          }
        }
      }
      fetchData();
    }
  };

  // Soft delete booking
  const softDeleteBooking = async (booking: Booking) => {
    if (!user) return;
    
    // Safety: warn if fully_paid
    if (booking.payment_status === "fully_paid") {
      if (!confirm("⚠️ This booking is FULLY PAID. Are you sure you want to delete it?")) return;
    }
    
    // Safety: warn if older than 30 days
    const daysSinceBooking = Math.ceil((Date.now() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceBooking > 30) {
      if (!confirm(`⚠️ This booking is ${daysSinceBooking} days old. Are you sure you want to delete it?`)) return;
    }

    setProcessingAction(true);
    try {
      // Release seats if confirmed
      if (booking.booking_status === "confirmed" && booking.batch_id) {
        await supabase.rpc("cancel_booking_with_seat_release", {
          p_booking_id: booking.id,
          p_reason: "Soft deleted by admin",
          p_refund_amount: 0,
        });
      }

      const { error } = await supabase
        .from("bookings")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq("id", booking.id);

      if (error) throw error;

      await supabase.rpc("create_audit_log", {
        p_user_id: user.id,
        p_action_type: "booking_soft_deleted",
        p_entity_type: "booking",
        p_entity_id: booking.id,
        p_metadata: { trip_id: booking.trip_id, customer: booking.full_name, previous_status: booking.booking_status },
      });

      toast({ title: "Booking Deleted", description: "Booking has been soft deleted." });
      fetchData();
      setSelectedBooking(null);
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error("Error soft deleting:", err);
      toast({ title: "Error", description: err.message || "Failed to delete booking", variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  // Force delete booking (super_admin only)
  const forceDeleteBooking = async (booking: Booking) => {
    if (!user) return;
    
    if (booking.payment_status === "fully_paid") {
      if (!confirm("⚠️ DANGER: This booking is FULLY PAID. Permanently deleting it will remove all records. Continue?")) return;
    }

    setProcessingAction(true);
    try {
      // Delete related records first
      await supabase.from("payment_reminders").delete().eq("booking_id", booking.id);
      await supabase.from("refunds").delete().eq("booking_id", booking.id);
      await supabase.from("payments").delete().eq("booking_id", booking.id);
      await supabase.from("reviews").delete().eq("booking_id", booking.id);
      await supabase.from("referral_earnings").delete().eq("booking_id", booking.id);

      // Release seats if confirmed
      if (booking.booking_status === "confirmed" && booking.batch_id) {
        const batch = batches.find(b => b.id === booking.batch_id);
        if (batch) {
          await supabase.from("batches").update({
            available_seats: (batch.available_seats || 0) + booking.num_travelers,
            seats_booked: Math.max(0, batch.seats_booked - booking.num_travelers),
          }).eq("id", batch.id);
        }
      }

      // Audit log before deletion
      await supabase.rpc("create_audit_log", {
        p_user_id: user.id,
        p_action_type: "booking_force_deleted",
        p_entity_type: "booking",
        p_entity_id: booking.id,
        p_metadata: { trip_id: booking.trip_id, customer: booking.full_name, total_amount: booking.total_amount, advance_paid: booking.advance_paid },
      });

      // Delete the booking
      const { error } = await supabase.from("bookings").delete().eq("id", booking.id);
      if (error) throw error;

      toast({ title: "Permanently Deleted", description: "Booking and all related records have been removed." });
      fetchData();
      setSelectedBooking(null);
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error("Error force deleting:", err);
      toast({ title: "Error", description: err.message || "Failed to permanently delete booking", variant: "destructive" });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Confirmed</Badge>;
      case "initiated":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Initiated</Badge>;
      case "expired":
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">Expired</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Cancelled</Badge>;
      case "refunded":
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">Refunded</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "fully_paid":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Fully Paid</Badge>;
      case "balance_verified":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Balance Verified</Badge>;
      case "balance_pending":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Balance Pending</Badge>;
      case "advance_verified":
        return <Badge className="bg-teal-500/20 text-teal-600 border-teal-500/30">Advance Verified</Badge>;
      case "pending_advance":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending Advance</Badge>;
      case "paid":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Paid</Badge>;
      case "partial":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Partial</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getRemainingPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case "uploaded":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Uploaded - Awaiting Review</Badge>;
      case "verified":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get bookings pending remaining payment verification
  const pendingRemainingVerification = bookings.filter(
    b => b.remaining_payment_status === "uploaded" && b.payment_status === "balance_pending"
  );

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin && !isStaffRole) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-muted-foreground">Manage bookings, leads, and trips</p>
                {roles.filter(r => r !== 'user').map(role => (
                  <Badge key={role} variant="outline" className="text-xs gap-1">
                    <Shield className="w-3 h-3" />
                    {getRoleLabel(role)}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Pending Remaining Payment Verification Alert */}
          {pendingRemainingVerification.length > 0 && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {pendingRemainingVerification.length} Remaining Payment(s) Awaiting Verification
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Users have uploaded payment screenshots that need your review.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setPaymentStatusFilter("balance_pending")}
                >
                  Review Now
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "initiated").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Initiated</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.payment_status === "pending_advance").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Advance</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "pending").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "confirmed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {pendingRemainingVerification.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Balance Review</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.payment_status === "fully_paid").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Fully Paid</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {interestedUsers.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Leads</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "expired").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "cancelled").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={can('view_analytics') ? "analytics" : can('view_bookings') ? "bookings" : "reviews"} className="space-y-6">
            <TabsList className="flex flex-wrap md:inline-flex gap-1">
              {can('view_analytics') && (
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
              )}
              {can('manage_trips') && (
                <TabsTrigger value="trips" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Trips
                </TabsTrigger>
              )}
              {can('manage_batches') && (
                <TabsTrigger value="batches" className="gap-2">
                  <Layers className="w-4 h-4" />
                  Batches
                </TabsTrigger>
              )}
              {can('view_bookings') && (
                <TabsTrigger value="bookings" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Bookings
                  {pendingRemainingVerification.length > 0 && (
                    <Badge className="ml-1 bg-blue-500 text-white">{pendingRemainingVerification.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              {can('process_refund') && (
                <TabsTrigger value="refunds" className="gap-2">
                  <DollarSign className="w-4 h-4" />
                  Refunds
                  {refunds.filter(r => r.refund_status === "pending").length > 0 && (
                    <Badge className="ml-1 bg-amber-500 text-white">{refunds.filter(r => r.refund_status === "pending").length}</Badge>
                  )}
                </TabsTrigger>
              )}
              {can('view_reviews') && (
                <TabsTrigger value="reviews" className="gap-2">
                  <Star className="w-4 h-4" />
                  Reviews
                </TabsTrigger>
              )}
              {can('view_leads') && (
                <TabsTrigger value="leads" className="gap-2">
                  <Users className="w-4 h-4" />
                  Leads
                </TabsTrigger>
              )}
              {can('view_audit_logs') && (
                <TabsTrigger value="audit" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Audit Logs
                </TabsTrigger>
              )}
              {can('manage_content') && (
                <TabsTrigger value="blog" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Blog
                </TabsTrigger>
              )}
              {can('view_financial_data') && (
                <TabsTrigger value="finance" className="gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Finance
                </TabsTrigger>
              )}
              {can('manage_content') && (
                <TabsTrigger value="broadcast" className="gap-2">
                  <Send className="w-4 h-4" />
                  WhatsApp
                </TabsTrigger>
              )}
              {can('manage_content') && (
                <TabsTrigger value="lead-capture" className="gap-2">
                  <Gift className="w-4 h-4" />
                  Lead Capture
                </TabsTrigger>
              )}
              {can('manage_operations') && (
                <TabsTrigger value="departure-ops" className="gap-2">
                  <Plane className="w-4 h-4" />
                  Departure Ops
                </TabsTrigger>
              )}
              {can('view_analytics') && (
                <TabsTrigger value="advanced-analytics" className="gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Deep Analytics
                </TabsTrigger>
              )}
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AdminAnalytics
                bookings={bookings}
                batches={batches}
                trips={analyticsTrips}
                destinations={analyticsDestinations}
              />
            </TabsContent>

            {/* Trips Tab */}
            <TabsContent value="trips">
              <TripManagement onRefresh={fetchData} />
            </TabsContent>

            {/* Batches Tab */}
            <TabsContent value="batches">
              <BatchManagement batches={batches} onRefresh={fetchData} />
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, or trip..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="pending_advance">Pending Advance</SelectItem>
                    <SelectItem value="advance_verified">Advance Verified</SelectItem>
                    <SelectItem value="balance_pending">Balance Pending</SelectItem>
                    <SelectItem value="fully_paid">Fully Paid</SelectItem>
                  </SelectContent>
                </Select>
                {can('delete_booking') && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showDeleted}
                      onChange={(e) => setShowDeleted(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Show Deleted</span>
                  </label>
                )}
              </div>

              {/* Bookings Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trip</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Advance</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className={`hover:bg-muted/30 transition-colors ${
                            booking.is_deleted ? "opacity-50 bg-red-500/5" : booking.remaining_payment_status === "uploaded" ? "bg-blue-500/5" : ""
                          }`}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{booking.full_name}</p>
                                <p className="text-sm text-muted-foreground">{booking.phone}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{booking.trip_id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.num_travelers} traveler(s)
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-foreground">₹{booking.total_amount.toLocaleString()}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-green-600">₹{booking.advance_paid.toLocaleString()}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {getPaymentStatusBadge(booking.payment_status)}
                                {booking.remaining_payment_status === "uploaded" && (
                                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">
                                    Balance Screenshot
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {getStatusBadge(booking.booking_status)}
                                {booking.is_deleted && (
                                  <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">
                                    <Trash2 className="w-3 h-3 mr-1" />Deleted
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant={booking.remaining_payment_status === "uploaded" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {booking.remaining_payment_status === "uploaded" ? "Review" : "View"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Refunds Tab */}
            <TabsContent value="refunds" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Booking</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Reason</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {refunds.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No refunds yet
                          </td>
                        </tr>
                      ) : (
                        refunds.map((refund) => {
                          const relatedBooking = bookings.find(b => b.id === refund.booking_id);
                          return (
                            <tr key={refund.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-foreground">{relatedBooking?.trip_id || "—"}</p>
                                <p className="text-xs text-muted-foreground">{refund.booking_id.slice(0, 8)}...</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-foreground">{relatedBooking?.full_name || "—"}</p>
                                <p className="text-sm text-muted-foreground">{relatedBooking?.phone || ""}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-foreground">₹{Number(refund.amount).toLocaleString()}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-foreground max-w-[200px] truncate">{refund.reason || "—"}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={
                                  refund.refund_status === "processed" 
                                    ? "bg-green-500/20 text-green-600 border-green-500/30" 
                                    : "bg-amber-500/20 text-amber-600 border-amber-500/30"
                                }>
                                  {refund.refund_status === "processed" ? "Processed" : "Pending"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-muted-foreground">{formatDate(refund.created_at)}</p>
                                {refund.processed_at && (
                                  <p className="text-xs text-green-600">Processed: {formatDate(refund.processed_at)}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {refund.refund_status === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateRefundStatus(refund.id, "processed")}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Mark Processed
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <ReviewsManagement />
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, email, or trip..."
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={() => {
                    const csvData = filteredInterested.map(lead => ({
                      Name: lead.full_name,
                      Email: lead.email || '',
                      Phone: lead.phone,
                      Trip: lead.trip_id,
                      'Preferred Month': lead.preferred_month || '',
                      'Submitted At': formatDate(lead.created_at),
                      Type: lead.user_id ? 'Registered' : 'Guest',
                    }));

                    const headers = Object.keys(csvData[0] || {});
                    const csvContent = [
                      headers.join(','),
                      ...csvData.map(row => 
                        headers.map(header => {
                          const value = row[header as keyof typeof row] || '';
                          const escaped = String(value).replace(/"/g, '""');
                          return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
                        }).join(',')
                      )
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `interested-users-${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    toast({
                      title: "Export Successful",
                      description: `Exported ${filteredInterested.length} leads to CSV`,
                    });
                  }} 
                  variant="outline"
                  disabled={filteredInterested.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV ({filteredInterested.length})
                </Button>
              </div>

              {/* Leads Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trip</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Preferred Month</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Submitted</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInterested.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            No leads found
                          </td>
                        </tr>
                      ) : (
                        filteredInterested.map((lead) => (
                          <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{lead.full_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <a 
                                  href={`tel:${lead.phone}`} 
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </a>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{lead.trip_id}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-foreground">{lead.preferred_month || "Not specified"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`https://wa.me/${lead.phone}`, '_blank')}
                                  title="Contact via WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                                  title="Call"
                                >
                                  <PhoneCall className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Audit Logs Tab */}
            {can('view_audit_logs') && (
              <TabsContent value="audit">
                <AuditLogs />
              </TabsContent>
            )}

            {/* Blog Tab */}
            {can('manage_content') && (
              <TabsContent value="blog">
                <BlogEditor destinations={analyticsDestinations} />
              </TabsContent>
            )}

            {/* Finance Tab */}
            {can('view_financial_data') && (
              <TabsContent value="finance">
                <FinancialReconciliation
                  bookings={bookings}
                  payments={payments}
                  refunds={refunds}
                  trips={analyticsTrips}
                  destinations={analyticsDestinations}
                />
              </TabsContent>
            )}

            {/* WhatsApp Broadcast Tab */}
            {can('manage_content') && (
              <TabsContent value="broadcast">
                <WhatsAppBroadcast />
              </TabsContent>
            )}

            {/* Lead Capture Tab */}
            {can('manage_content') && (
              <TabsContent value="lead-capture">
                <LeadsCaptureManagement />
              </TabsContent>
            )}

            {/* Departure Ops Tab */}
            {can('manage_operations') && (
              <TabsContent value="departure-ops">
                <DepartureOps
                  bookings={bookings}
                  batches={batches}
                  trips={analyticsTrips}
                />
              </TabsContent>
            )}

            {/* Advanced Analytics Tab */}
            {can('view_analytics') && (
              <TabsContent value="advanced-analytics">
                <AdvancedAnalytics
                  bookings={bookings}
                  trips={analyticsTrips}
                  destinations={analyticsDestinations}
                  leads={leads}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => {
              setSelectedBooking(null);
              setShowRejectModal(false);
              setRejectionReason("");
              setShowCancelModal(false);
              setCancelReason("");
              setCancelRefundAmount("0");
              setShowDeleteConfirm(null);
            }}
          />
          <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-card-foreground">Booking Details</h2>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelRefundAmount("0");
                  setShowDeleteConfirm(null);
                }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium text-foreground">{selectedBooking.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedBooking.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{selectedBooking.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trip</p>
                  <p className="font-medium text-foreground">{selectedBooking.trip_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travelers</p>
                  <p className="font-medium text-foreground">{selectedBooking.num_travelers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-medium text-foreground capitalize">{selectedBooking.pickup_location || "Not specified"}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Payment Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-bold text-foreground text-lg">₹{selectedBooking.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Advance Paid</p>
                    <p className="font-bold text-green-600 text-lg">₹{selectedBooking.advance_paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance Amount</p>
                    <p className="font-bold text-amber-600 text-lg">
                      ₹{Math.max(0, selectedBooking.total_amount - selectedBooking.advance_paid).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    {getPaymentStatusBadge(selectedBooking.payment_status)}
                  </div>
                </div>

                {/* Remaining Payment Status */}
                {selectedBooking.remaining_payment_status && selectedBooking.remaining_payment_status !== "pending" && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining Payment Status</p>
                        {getRemainingPaymentStatusBadge(selectedBooking.remaining_payment_status)}
                      </div>
                      {selectedBooking.remaining_payment_uploaded_at && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Uploaded At</p>
                          <p className="text-sm font-medium">{formatDate(selectedBooking.remaining_payment_uploaded_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedBooking.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium text-foreground">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Screenshots Section */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  Payment Screenshots
                </h4>
                
                {loadingScreenshots ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Advance Payment Screenshot */}
                    <div className="border border-border rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground mb-2">Advance Payment</p>
                      {advanceScreenshotUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={advanceScreenshotUrl} 
                            alt="Advance Payment Screenshot" 
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewingImage(advanceScreenshotUrl)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(advanceScreenshotUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Full Image
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed border-border">
                          <div className="text-center">
                            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                            <p className="text-sm text-muted-foreground">No screenshot uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remaining Payment Screenshot */}
                    <div className="border border-border rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground mb-2">Remaining Payment</p>
                      {remainingScreenshotUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={remainingScreenshotUrl} 
                            alt="Remaining Payment Screenshot" 
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewingImage(remainingScreenshotUrl)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(remainingScreenshotUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Full Image
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed border-border">
                          <div className="text-center">
                            {selectedBooking.payment_status === "balance_pending" || selectedBooking.remaining_payment_status === "uploaded" ? (
                              <>
                                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                                <p className="text-sm text-muted-foreground">Awaiting upload</p>
                              </>
                            ) : (
                              <>
                                <Image className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                                <p className="text-sm text-muted-foreground">Not applicable yet</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Status</p>
                  {getStatusBadge(selectedBooking.booking_status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booked On</p>
                  <p className="font-medium text-foreground">{formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>

              {/* Cancellation Info */}
              {selectedBooking.booking_status === "cancelled" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    Cancellation Details
                  </h4>
                  {selectedBooking.cancellation_reason && (
                    <p className="text-sm text-foreground mb-1"><strong>Reason:</strong> {selectedBooking.cancellation_reason}</p>
                  )}
                  {selectedBooking.cancelled_at && (
                    <p className="text-sm text-muted-foreground">Cancelled on: {formatDate(selectedBooking.cancelled_at)}</p>
                  )}
                  {(() => {
                    const bookingRefunds = refunds.filter(r => r.booking_id === selectedBooking.id);
                    if (bookingRefunds.length === 0) return null;
                    return (
                      <div className="mt-2 pt-2 border-t border-red-500/20">
                        <p className="text-sm font-medium text-foreground mb-1">Refund(s):</p>
                        {bookingRefunds.map(r => (
                          <div key={r.id} className="flex items-center justify-between text-sm">
                            <span>₹{Number(r.amount).toLocaleString()}</span>
                            <Badge className={r.refund_status === "processed" ? "bg-green-500/20 text-green-600" : "bg-amber-500/20 text-amber-600"}>
                              {r.refund_status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Rejection Reason Input */}
              {showRejectModal && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                    {selectedBooking.payment_status === "pending_advance" ? "Reject Advance Payment" : "Reject Remaining Payment"}
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    Please provide a reason for rejection. This will be shown to the user.
                  </p>
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (selectedBooking.payment_status === "pending_advance") {
                          rejectAdvancePayment(selectedBooking, rejectionReason);
                        } else {
                          rejectRemainingPayment(selectedBooking, rejectionReason);
                        }
                      }}
                      disabled={!rejectionReason.trim() || processingAction}
                    >
                      {processingAction ? "Processing..." : "Confirm Rejection"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectionReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Control Panel - visible to super_admin, finance_manager, admin */}
              {can('verify_payments') && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Payment Control Panel
                  </h4>

                  {/* Payment Progress Visual */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      selectedBooking.advance_paid > 0 ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'
                    }`}>
                      {selectedBooking.advance_paid > 0 ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      Advance {selectedBooking.advance_paid > 0 ? '✓' : 'Pending'}
                    </div>
                    <div className="w-4 h-px bg-border" />
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      ['advance_verified', 'balance_pending', 'fully_paid'].includes(selectedBooking.payment_status) 
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {['advance_verified', 'balance_pending', 'fully_paid'].includes(selectedBooking.payment_status)
                        ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      Advance Verified
                    </div>
                    <div className="w-4 h-px bg-border" />
                    {(() => {
                      const balanceAmount = selectedBooking.total_amount - selectedBooking.advance_paid;
                      const batch = batches.find(b => b.id === selectedBooking.batch_id);
                      const daysUntilTrip = batch ? Math.ceil((new Date(batch.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                      const isUrgent = daysUntilTrip !== null && daysUntilTrip <= 3 && daysUntilTrip > 0;
                      return (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          selectedBooking.payment_status === 'fully_paid'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : isUrgent
                              ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                              : balanceAmount > 0
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                        }`}>
                          {selectedBooking.payment_status === 'fully_paid' ? <CheckCircle className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                          {selectedBooking.payment_status === 'fully_paid' ? 'Fully Paid ✓' : `Balance ₹${balanceAmount.toLocaleString()}`}
                          {isUrgent && selectedBooking.payment_status !== 'fully_paid' && ` (${daysUntilTrip}d left!)`}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* Pending Advance - Verify Advance Payment */}
                    {(selectedBooking.booking_status === "pending" || selectedBooking.booking_status === "confirmed") && 
                     selectedBooking.payment_status === "pending_advance" && (
                      <>
                        <Button
                          onClick={() => verifyAdvancePayment(selectedBooking)}
                          className="flex-1"
                          disabled={!advanceScreenshotUrl || processingAction}
                        >
                          {processingAction ? "Processing..." : (
                            <><CheckCircle className="w-4 h-4 mr-2" />Verify Advance & Confirm</>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectModal(true)}
                          className="flex-1"
                          disabled={processingAction}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Advance
                        </Button>
                      </>
                    )}

                    {/* Legacy pending status */}
                    {selectedBooking.booking_status === "pending" && selectedBooking.payment_status === "pending" && (
                      <>
                        <Button
                          onClick={() => verifyAdvancePayment(selectedBooking)}
                          className="flex-1"
                          disabled={processingAction}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Booking
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}

                    {/* Advance Verified - Wait for balance or mark fully paid */}
                    {selectedBooking.booking_status === "confirmed" && 
                     selectedBooking.payment_status === "advance_verified" && 
                     selectedBooking.remaining_payment_status !== "uploaded" && (
                      <>
                        <Button
                          onClick={() => sendBalanceReminder(selectedBooking)}
                          variant="outline"
                          className="flex-1"
                          disabled={processingAction}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Balance Reminder
                        </Button>
                        <Button
                          onClick={async () => {
                            if (selectedBooking.payment_status === "fully_paid") {
                              toast({ title: "Already Paid", description: "This booking is already fully paid.", variant: "destructive" });
                              return;
                            }
                            const balanceAmt = selectedBooking.total_amount - selectedBooking.advance_paid;
                            if (balanceAmt <= 0) {
                              toast({ title: "No Balance", description: "Balance is already zero.", variant: "destructive" });
                              return;
                            }
                            setProcessingAction(true);
                            try {
                              const { error } = await supabase
                                .from("bookings")
                                .update({
                                  booking_status: "confirmed",
                                  payment_status: "fully_paid",
                                  remaining_payment_status: "verified",
                                  remaining_payment_verified_at: new Date().toISOString(),
                                  verified_by_admin_id: user!.id,
                                })
                                .eq("id", selectedBooking.id);
                              if (error) throw error;
                              await supabase.rpc("create_audit_log", {
                                p_user_id: user!.id,
                                p_action_type: "balance_marked_paid",
                                p_entity_type: "booking",
                                p_entity_id: selectedBooking.id,
                                p_metadata: { trip_id: selectedBooking.trip_id, balance_amount: balanceAmt, customer: selectedBooking.full_name },
                              });
                              toast({ title: "Marked Fully Paid", description: "Booking is now fully paid." });
                              const bookingDetails: BookingDetails = {
                                userName: selectedBooking.full_name,
                                tripName: selectedBooking.trip_id,
                                advanceAmount: selectedBooking.advance_paid,
                                remainingAmount: balanceAmt,
                                bookingId: selectedBooking.id,
                                phone: selectedBooking.phone,
                              };
                              openWhatsAppFullyPaid(selectedBooking.phone, bookingDetails);
                              fetchData();
                              setSelectedBooking(null);
                            } catch (err) {
                              console.error("Error marking fully paid:", err);
                              toast({ title: "Error", description: "Failed to mark as fully paid", variant: "destructive" });
                            } finally {
                              setProcessingAction(false);
                            }
                          }}
                          className="flex-1"
                          disabled={processingAction}
                        >
                          {processingAction ? "Processing..." : (
                            <><Wallet className="w-4 h-4 mr-2" />Mark Fully Paid</>
                          )}
                        </Button>
                      </>
                    )}

                    {/* Remaining Payment Uploaded - Verify or Reject */}
                    {selectedBooking.remaining_payment_status === "uploaded" && !showRejectModal && (
                      <>
                        <Button
                          onClick={() => {
                            if (!remainingScreenshotUrl) {
                              toast({ title: "Warning", description: "No remaining payment screenshot found. Cannot verify.", variant: "destructive" });
                              return;
                            }
                            verifyRemainingPayment(selectedBooking);
                          }}
                          className="flex-1"
                          disabled={!remainingScreenshotUrl || processingAction}
                        >
                          {processingAction ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Processing...</>
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-2" />Verify & Mark Fully Paid</>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectModal(true)}
                          className="flex-1"
                          disabled={processingAction}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Payment
                        </Button>
                      </>
                    )}

                    {/* Balance Pending but no screenshot uploaded yet */}
                    {selectedBooking.booking_status === "confirmed" && 
                     selectedBooking.payment_status === "balance_pending" && 
                     selectedBooking.remaining_payment_status === "pending" && (
                      <div className="w-full flex gap-3">
                        <div className="flex-1 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            Waiting for user to upload remaining payment screenshot.
                          </p>
                        </div>
                        <Button
                          onClick={() => sendBalanceReminder(selectedBooking)}
                          variant="outline"
                          disabled={processingAction}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Reminder
                        </Button>
                      </div>
                    )}

                    {/* Legacy partial status */}
                    {selectedBooking.booking_status === "confirmed" && selectedBooking.payment_status === "partial" && (
                      <Button
                        onClick={() => updateBookingStatus(selectedBooking.id, "confirmed", "fully_paid")}
                        className="flex-1"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Mark as Fully Paid
                      </Button>
                    )}

                    {/* Fully Paid */}
                    {selectedBooking.payment_status === "fully_paid" && (
                      <div className="w-full p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-700 dark:text-green-400">
                          This booking is fully paid and confirmed.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* General Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                {/* Cancel Booking Button */}
                {can('cancel_booking') && !["cancelled", "expired", "refunded"].includes(selectedBooking.booking_status) && !showCancelModal && !selectedBooking.is_deleted && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowCancelModal(true);
                      setCancelRefundAmount(selectedBooking.advance_paid > 0 ? selectedBooking.advance_paid.toString() : "0");
                    }}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                )}

                {/* Soft Delete */}
                {can('delete_booking') && !selectedBooking.is_deleted && !showDeleteConfirm && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => setShowDeleteConfirm("soft")}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Booking
                  </Button>
                )}

                {/* Force Delete (Super Admin Only) */}
                {can('force_delete_booking') && !showDeleteConfirm && (
                  <Button
                    variant="outline"
                    className="text-red-700 border-red-400 hover:bg-red-100 dark:hover:bg-red-950"
                    onClick={() => setShowDeleteConfirm("force")}
                  >
                    <ArchiveX className="w-4 h-4 mr-2" />
                    Permanently Delete
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${selectedBooking.phone}`, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className={`rounded-lg p-4 border ${showDeleteConfirm === "force" ? "bg-red-600/10 border-red-600/30" : "bg-red-500/10 border-red-500/30"}`}>
                  <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    {showDeleteConfirm === "force" ? <ArchiveX className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    {showDeleteConfirm === "force" ? "Permanently Delete Booking" : "Soft Delete Booking"}
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    {showDeleteConfirm === "force"
                      ? "⚠️ This will PERMANENTLY delete the booking and all related records (payments, refunds, reviews). This CANNOT be undone."
                      : "This will mark the booking as deleted. It can still be viewed with 'Show Deleted' toggle. Confirmed bookings will have their seats released."
                    }
                  </p>
                  {selectedBooking.is_deleted && showDeleteConfirm === "soft" && (
                    <p className="text-sm text-amber-600 mb-3">This booking is already soft-deleted.</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (showDeleteConfirm === "force") {
                          forceDeleteBooking(selectedBooking);
                        } else {
                          softDeleteBooking(selectedBooking);
                        }
                      }}
                      disabled={processingAction || (showDeleteConfirm === "soft" && selectedBooking.is_deleted)}
                    >
                      {processingAction ? "Processing..." : showDeleteConfirm === "force" ? "Confirm Permanent Delete" : "Confirm Delete"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                      Go Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Cancel Booking Modal */}
              {showCancelModal && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    Cancel Booking
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    This will cancel the booking{selectedBooking.booking_status === "confirmed" ? " and release seats back to the batch" : ""}. This action cannot be undone.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm mb-1 block">Cancellation Reason *</Label>
                      <Textarea
                        placeholder="Enter reason for cancellation..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Refund Amount (₹)</Label>
                      <Input
                        type="number"
                        value={cancelRefundAmount}
                        onChange={(e) => setCancelRefundAmount(e.target.value)}
                        min="0"
                        max={selectedBooking.total_amount.toString()}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Total paid: ₹{selectedBooking.advance_paid.toLocaleString()} | Set to 0 for no refund
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => cancelBooking(selectedBooking, cancelReason, parseFloat(cancelRefundAmount) || 0)}
                        disabled={!cancelReason.trim() || processingAction}
                      >
                        {processingAction ? "Cancelling..." : "Confirm Cancellation"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCancelModal(false);
                          setCancelReason("");
                          setCancelRefundAmount("0");
                        }}
                      >
                        Go Back
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning Messages */}
              {!advanceScreenshotUrl && selectedBooking.payment_status === "pending_advance" && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Warning: No advance payment screenshot found. Please verify payment before confirming.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={() => setViewingImage(null)}
        >
          <img 
            src={viewingImage} 
            alt="Payment Screenshot" 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <XCircle className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Admin;