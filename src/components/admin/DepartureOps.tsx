import { useState, useMemo, memo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { Download, Users, IndianRupee, AlertTriangle, Phone, MapPin, FileText, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Booking {
  id: string;
  trip_id: string;
  batch_id: string | null;
  full_name: string;
  phone: string;
  pickup_location: string | null;
  num_travelers: number;
  total_amount: number;
  advance_paid: number;
  payment_status: string;
  booking_status: string;
  notes: string | null;
  is_deleted: boolean;
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

interface Trip {
  trip_id: string;
  trip_name: string;
  destination_id: string | null;
}

interface DepartureOpsProps {
  bookings: Booking[];
  batches: Batch[];
  trips: Trip[];
}

const DepartureOps = ({ bookings, batches, trips }: DepartureOpsProps) => {
  const [tripFilter, setTripFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all"); // all | balance_pending | fully_paid
  const [showUpcoming, setShowUpcoming] = useState(true);

  const tripMap = useMemo(() => {
    const m: Record<string, string> = {};
    trips.forEach(t => { m[t.trip_id] = t.trip_name; });
    return m;
  }, [trips]);

  // Filter batches: upcoming departures by default
  const filteredBatches = useMemo(() => {
    let filtered = batches;
    if (showUpcoming) {
      const today = new Date();
      filtered = filtered.filter(b => new Date(b.start_date) >= today);
    }
    if (tripFilter !== "all") {
      filtered = filtered.filter(b => b.trip_id === tripFilter);
    }
    if (batchFilter !== "all") {
      filtered = filtered.filter(b => b.id === batchFilter);
    }
    return filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [batches, tripFilter, batchFilter, showUpcoming]);

  const batchIds = useMemo(() => new Set(filteredBatches.map(b => b.id)), [filteredBatches]);

  // Get confirmed, non-deleted bookings for filtered batches
  const manifest = useMemo(() => {
    let filtered = bookings.filter(b =>
      b.booking_status === "confirmed" &&
      !b.is_deleted &&
      b.batch_id &&
      batchIds.has(b.batch_id)
    );

    if (paymentFilter === "balance_pending") {
      filtered = filtered.filter(b => b.payment_status !== "fully_paid");
    } else if (paymentFilter === "fully_paid") {
      filtered = filtered.filter(b => b.payment_status === "fully_paid");
    }

    return filtered;
  }, [bookings, batchIds, paymentFilter]);

  // Summary stats
  const totalTravelers = useMemo(() => manifest.reduce((s, b) => s + b.num_travelers, 0), [manifest]);
  const totalSeatsFilled = manifest.length;
  const balancePendingCount = useMemo(() => manifest.filter(b => b.payment_status !== "fully_paid").length, [manifest]);
  const totalBalanceDue = useMemo(() => manifest.filter(b => b.payment_status !== "fully_paid").reduce((s, b) => s + (b.total_amount - b.advance_paid), 0), [manifest]);

  // Available batches for the batch dropdown (filtered by trip)
  const batchOptions = useMemo(() => {
    if (tripFilter === "all") return batches;
    return batches.filter(b => b.trip_id === tripFilter);
  }, [batches, tripFilter]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["Traveler Name", "Phone", "Pickup Point", "Travelers", "Trip", "Batch", "Departure", "Payment Status", "Total Amount", "Advance Paid", "Balance Due", "Notes"];
    const rows = manifest.map(b => {
      const batch = batches.find(ba => ba.id === b.batch_id);
      return [
        b.full_name,
        b.phone,
        b.pickup_location || "-",
        b.num_travelers,
        tripMap[b.trip_id] || b.trip_id,
        batch?.batch_name || "-",
        batch ? format(parseISO(batch.start_date), "dd MMM yyyy") : "-",
        b.payment_status,
        b.total_amount,
        b.advance_paid,
        b.total_amount - b.advance_paid,
        (b.notes || "").replace(/,/g, ";"),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `departure-manifest-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPaymentBadge = (status: string) => {
    if (status === "fully_paid") return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">Fully Paid</Badge>;
    if (status === "advance_verified") return <Badge className="bg-teal-500/20 text-teal-600 border-teal-500/30 text-xs">Advance Only</Badge>;
    return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Trip</p>
              <Select value={tripFilter} onValueChange={(v) => { setTripFilter(v); setBatchFilter("all"); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Trips" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trips</SelectItem>
                  {trips.map(t => (
                    <SelectItem key={t.trip_id} value={t.trip_id}>{t.trip_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Batch</p>
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batchOptions.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.batch_name} ({format(parseISO(b.start_date), "dd MMM")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Payment</p>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="balance_pending">Balance Pending</SelectItem>
                  <SelectItem value="fully_paid">Fully Paid Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="upcoming" checked={showUpcoming} onCheckedChange={setShowUpcoming} />
              <Label htmlFor="upcoming" className="text-sm">Upcoming only</Label>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={manifest.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalTravelers}</p>
                <p className="text-sm text-muted-foreground">Total Travelers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSeatsFilled}</p>
                <p className="text-sm text-muted-foreground">Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{balancePendingCount}</p>
                <p className="text-sm text-muted-foreground">Balance Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₹{totalBalanceDue.toLocaleString("en-IN")}</p>
                <p className="text-sm text-muted-foreground">Total Balance Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch-wise Manifest */}
      {filteredBatches.map(batch => {
        const batchBookings = manifest.filter(b => b.batch_id === batch.id);
        if (batchBookings.length === 0) return null;

        const daysUntil = differenceInDays(parseISO(batch.start_date), new Date());
        const batchTravelers = batchBookings.reduce((s, b) => s + b.num_travelers, 0);
        const batchBalancePending = batchBookings.filter(b => b.payment_status !== "fully_paid").length;

        return (
          <Card key={batch.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {tripMap[batch.trip_id] || batch.trip_id} – {batch.batch_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(batch.start_date), "dd MMM yyyy")} → {format(parseISO(batch.end_date), "dd MMM yyyy")}
                    {daysUntil >= 0 && (
                      <span className={`ml-2 font-medium ${daysUntil <= 3 ? "text-red-500" : daysUntil <= 7 ? "text-amber-500" : "text-muted-foreground"}`}>
                        ({daysUntil === 0 ? "Today!" : `${daysUntil}d away`})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <Badge variant="outline">{batchTravelers} travelers</Badge>
                  <Badge variant="outline">{batchBookings.length} / {batch.batch_size} seats</Badge>
                  {batchBalancePending > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                      {batchBalancePending} balance pending
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Traveler</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead className="text-center">Pax</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchBookings.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.full_name}</TableCell>
                        <TableCell>
                          <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone className="w-3 h-3" />
                            {b.phone}
                          </a>
                        </TableCell>
                        <TableCell>{b.pickup_location || <span className="text-muted-foreground">–</span>}</TableCell>
                        <TableCell className="text-center">{b.num_travelers}</TableCell>
                        <TableCell>{getPaymentBadge(b.payment_status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {b.payment_status === "fully_paid" ? (
                            <span className="text-green-600">₹0</span>
                          ) : (
                            <span className="text-amber-600">₹{(b.total_amount - b.advance_paid).toLocaleString("en-IN")}</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {b.notes || "–"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {manifest.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No confirmed bookings found for the selected filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(DepartureOps);
