import { CheckCircle, Clock, Users, Wallet, Calendar, MapPin } from "lucide-react";

interface AdminStatsProps {
  bookings: any[];
  interestedUsers: any[];
  batches: any[];
}

const AdminStats = ({ bookings, interestedUsers, batches }: AdminStatsProps) => {
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const partialPayments = bookings.filter((b) => b.payment_status === "partial" || b.payment_status === "pending_advance").length;
  const newLeads = interestedUsers.filter((u) => u.status === "interested").length;
  const activeBatches = batches.filter((b) => b.status === "active").length;
  const totalTrips = [...new Set(batches.map((b) => b.trip_id))].length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{pendingBookings}</p>
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
            <p className="text-2xl font-bold text-foreground">{confirmedBookings}</p>
            <p className="text-sm text-muted-foreground">Confirmed</p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{partialPayments}</p>
            <p className="text-sm text-muted-foreground">Partial Paid</p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{newLeads}</p>
            <p className="text-sm text-muted-foreground">New Leads</p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeBatches}</p>
            <p className="text-sm text-muted-foreground">Active Batches</p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalTrips}</p>
            <p className="text-sm text-muted-foreground">Total Trips</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
