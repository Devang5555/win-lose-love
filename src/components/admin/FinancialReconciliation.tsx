import { useMemo, useState, memo } from "react";
import { format, parseISO } from "date-fns";
import {
  IndianRupee, AlertTriangle, Download, TrendingUp, TrendingDown,
  CalendarIcon, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  trip_id: string;
  batch_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  num_travelers: number;
  total_amount: number;
  advance_paid: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
}

interface Payment {
  id: string;
  booking_id: string | null;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
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

interface Trip {
  trip_id: string;
  trip_name: string;
  destination_id: string | null;
}

interface Destination {
  id: string;
  name: string;
}

interface FinancialReconciliationProps {
  bookings: Booking[];
  payments: Payment[];
  refunds: Refund[];
  trips: Trip[];
  destinations: Destination[];
}

type MismatchType =
  | "paid_no_payment_record"
  | "amount_mismatch"
  | "refund_not_marked"
  | "confirmed_no_payment";

interface Mismatch {
  bookingId: string;
  customerName: string;
  tripName: string;
  type: MismatchType;
  description: string;
  bookingAmount: number;
  paymentAmount: number;
}

const MISMATCH_LABELS: Record<MismatchType, { label: string; color: string }> = {
  paid_no_payment_record: { label: "No Payment Record", color: "bg-red-500/20 text-red-600 border-red-500/30" },
  amount_mismatch: { label: "Amount Mismatch", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
  refund_not_marked: { label: "Refund Not Marked", color: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
  confirmed_no_payment: { label: "Missing Payment", color: "bg-orange-500/20 text-orange-600 border-orange-500/30" },
};

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const FinancialReconciliation = ({
  bookings,
  payments,
  refunds,
  trips,
  destinations,
}: FinancialReconciliationProps) => {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [tripFilter, setTripFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [refundStatusFilter, setRefundStatusFilter] = useState("all");

  const tripMap = useMemo(() => {
    const m: Record<string, Trip> = {};
    trips.forEach((t) => { m[t.trip_id] = t; });
    return m;
  }, [trips]);

  const destMap = useMemo(() => {
    const m: Record<string, string> = {};
    destinations.forEach((d) => { m[d.id] = d.name; });
    return m;
  }, [destinations]);

  // Payment lookup by booking_id
  const paymentsByBooking = useMemo(() => {
    const m: Record<string, Payment[]> = {};
    payments.forEach((p) => {
      if (p.booking_id) {
        if (!m[p.booking_id]) m[p.booking_id] = [];
        m[p.booking_id].push(p);
      }
    });
    return m;
  }, [payments]);

  // Refund lookup by booking_id
  const refundsByBooking = useMemo(() => {
    const m: Record<string, Refund[]> = {};
    refunds.forEach((r) => {
      if (!m[r.booking_id]) m[r.booking_id] = [];
      m[r.booking_id].push(r);
    });
    return m;
  }, [refunds]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (dateFrom || dateTo) {
        const d = parseISO(b.created_at);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
      const trip = tripMap[b.trip_id];
      if (destinationFilter !== "all" && trip?.destination_id !== destinationFilter) return false;
      if (tripFilter !== "all" && b.trip_id !== tripFilter) return false;
      if (paymentStatusFilter !== "all" && b.payment_status !== paymentStatusFilter) return false;
      if (refundStatusFilter !== "all") {
        const bRefunds = refundsByBooking[b.id] || [];
        if (refundStatusFilter === "has_refund" && bRefunds.length === 0) return false;
        if (refundStatusFilter === "no_refund" && bRefunds.length > 0) return false;
        if (refundStatusFilter === "pending_refund" && !bRefunds.some((r) => r.refund_status === "pending")) return false;
        if (refundStatusFilter === "processed_refund" && !bRefunds.some((r) => r.refund_status === "processed")) return false;
      }
      return true;
    });
  }, [bookings, dateFrom, dateTo, destinationFilter, tripFilter, paymentStatusFilter, refundStatusFilter, tripMap, refundsByBooking]);

  // Reconciliation rows
  const reconciliationData = useMemo(() => {
    return filteredBookings.map((b) => {
      const bPayments = paymentsByBooking[b.id] || [];
      const bRefunds = refundsByBooking[b.id] || [];
      const totalPaymentReceived = bPayments.reduce((s, p) => s + p.amount, 0);
      const totalRefundAmount = bRefunds.reduce((s, r) => s + Number(r.amount), 0);
      const netRevenue = totalPaymentReceived - totalRefundAmount;
      const tripName = tripMap[b.trip_id]?.trip_name || b.trip_id;

      return {
        booking: b,
        tripName,
        totalPaymentReceived,
        totalRefundAmount,
        netRevenue,
        payments: bPayments,
        refunds: bRefunds,
      };
    });
  }, [filteredBookings, paymentsByBooking, refundsByBooking, tripMap]);

  // Revenue breakdown (confirmed bookings only)
  const revenueBreakdown = useMemo(() => {
    const confirmedRows = reconciliationData.filter(
      (r) => r.booking.booking_status === "confirmed" || r.booking.booking_status === "refunded"
    );
    const grossRevenue = confirmedRows.reduce((s, r) => s + r.booking.total_amount, 0);
    const totalPayments = confirmedRows.reduce((s, r) => s + r.totalPaymentReceived, 0);
    const totalRefunds = confirmedRows.reduce((s, r) => s + r.totalRefundAmount, 0);
    const netRevenue = totalPayments - totalRefunds;
    const totalAdvance = confirmedRows.reduce((s, r) => s + r.booking.advance_paid, 0);
    const outstandingBalance = grossRevenue - totalPayments;

    return { grossRevenue, totalPayments, totalRefunds, netRevenue, totalAdvance, outstandingBalance, count: confirmedRows.length };
  }, [reconciliationData]);

  // Mismatch detection
  const mismatches = useMemo(() => {
    const issues: Mismatch[] = [];
    filteredBookings.forEach((b) => {
      const bPayments = paymentsByBooking[b.id] || [];
      const bRefunds = refundsByBooking[b.id] || [];
      const totalPaid = bPayments.reduce((s, p) => s + p.amount, 0);
      const tripName = tripMap[b.trip_id]?.trip_name || b.trip_id;

      // paid but no payment record
      if (b.payment_status === "fully_paid" && bPayments.length === 0) {
        issues.push({
          bookingId: b.id,
          customerName: b.full_name,
          tripName,
          type: "paid_no_payment_record",
          description: "Booking marked as fully paid but no payment records found in payments table.",
          bookingAmount: b.total_amount,
          paymentAmount: 0,
        });
      }

      // amount mismatch
      if (bPayments.length > 0 && totalPaid !== b.total_amount && b.payment_status === "fully_paid") {
        issues.push({
          bookingId: b.id,
          customerName: b.full_name,
          tripName,
          type: "amount_mismatch",
          description: `Payment total (${formatCurrency(totalPaid)}) doesn't match booking amount (${formatCurrency(b.total_amount)}).`,
          bookingAmount: b.total_amount,
          paymentAmount: totalPaid,
        });
      }

      // refund exists but booking not refunded
      if (bRefunds.some((r) => r.refund_status === "processed") && b.booking_status !== "refunded") {
        issues.push({
          bookingId: b.id,
          customerName: b.full_name,
          tripName,
          type: "refund_not_marked",
          description: "Processed refund exists but booking is not marked as refunded.",
          bookingAmount: b.total_amount,
          paymentAmount: totalPaid,
        });
      }

      // confirmed but no payment at all
      if (b.booking_status === "confirmed" && b.payment_status === "pending" && bPayments.length === 0 && b.advance_paid === 0) {
        issues.push({
          bookingId: b.id,
          customerName: b.full_name,
          tripName,
          type: "confirmed_no_payment",
          description: "Booking is confirmed but has no payment recorded.",
          bookingAmount: b.total_amount,
          paymentAmount: 0,
        });
      }
    });
    return issues;
  }, [filteredBookings, paymentsByBooking, refundsByBooking, tripMap]);

  // CSV export
  const exportCSV = () => {
    const rows = reconciliationData.map((r) => ({
      "Booking ID": r.booking.id,
      "Customer": r.booking.full_name,
      "Email": r.booking.email,
      "Phone": r.booking.phone,
      "Trip": r.tripName,
      "Booking Date": format(parseISO(r.booking.created_at), "yyyy-MM-dd"),
      "Booking Amount": r.booking.total_amount,
      "Advance Paid": r.booking.advance_paid,
      "Payment Received": r.totalPaymentReceived,
      "Refund Amount": r.totalRefundAmount,
      "Net Revenue": r.netRevenue,
      "Booking Status": r.booking.booking_status,
      "Payment Status": r.booking.payment_status,
    }));

    if (rows.length === 0) {
      toast({ title: "No data", description: "No records to export.", variant: "destructive" });
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h as keyof typeof row] ?? "");
            const escaped = val.replace(/"/g, '""');
            return escaped.includes(",") || escaped.includes('"') ? `"${escaped}"` : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `finance-reconciliation-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Exported", description: `${rows.length} records exported to CSV.` });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">From Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd MMM yy") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">To Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd MMM yy") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Destination</p>
              <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations</SelectItem>
                  {destinations.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Trip</p>
              <Select value={tripFilter} onValueChange={setTripFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trips</SelectItem>
                  {trips.map((t) => <SelectItem key={t.trip_id} value={t.trip_id}>{t.trip_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Payment</p>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pending_advance">Pending Advance</SelectItem>
                  <SelectItem value="advance_verified">Advance Verified</SelectItem>
                  <SelectItem value="balance_pending">Balance Pending</SelectItem>
                  <SelectItem value="fully_paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Refund</p>
              <Select value={refundStatusFilter} onValueChange={setRefundStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="has_refund">Has Refund</SelectItem>
                  <SelectItem value="no_refund">No Refund</SelectItem>
                  <SelectItem value="pending_refund">Pending Refund</SelectItem>
                  <SelectItem value="processed_refund">Processed Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            {(dateFrom || dateTo || destinationFilter !== "all" || tripFilter !== "all" || paymentStatusFilter !== "all" || refundStatusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => {
                setDateFrom(undefined); setDateTo(undefined);
                setDestinationFilter("all"); setTripFilter("all");
                setPaymentStatusFilter("all"); setRefundStatusFilter("all");
              }}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(revenueBreakdown.grossRevenue)}</p>
                <p className="text-xs text-muted-foreground">Gross Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(revenueBreakdown.totalPayments)}</p>
                <p className="text-xs text-muted-foreground">Payments Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(revenueBreakdown.totalRefunds)}</p>
                <p className="text-xs text-muted-foreground">Total Refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(revenueBreakdown.netRevenue)}</p>
                <p className="text-xs text-muted-foreground">Net Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-teal-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(revenueBreakdown.totalAdvance)}</p>
                <p className="text-xs text-muted-foreground">Advance Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(revenueBreakdown.outstandingBalance)}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mismatches Alert */}
      {mismatches.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              {mismatches.length} Reconciliation Issue{mismatches.length > 1 ? "s" : ""} Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {mismatches.map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-muted/30">
                  <Badge className={MISMATCH_LABELS[m.type].color}>{MISMATCH_LABELS[m.type].label}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.customerName} — {m.tripName}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Booking: {formatCurrency(m.bookingAmount)} | Payment: {formatCurrency(m.paymentAmount)} | ID: {m.bookingId.slice(0, 8)}…
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Sub-tabs */}
      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Payment Ledger</TabsTrigger>
          <TabsTrigger value="refunds">
            Refund History
            {refunds.filter((r) => r.refund_status === "pending").length > 0 && (
              <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5">
                {refunds.filter((r) => r.refund_status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Payment Ledger */}
        <TabsContent value="ledger">
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Trip</TableHead>
                      <TableHead className="text-right">Booking Amt</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead className="text-right">Refund</TableHead>
                      <TableHead className="text-right">Net Revenue</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No bookings found for selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reconciliationData.map((r) => {
                        const hasMismatch = mismatches.some((m) => m.bookingId === r.booking.id);
                        return (
                          <TableRow key={r.booking.id} className={hasMismatch ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-mono text-xs">
                              {r.booking.id.slice(0, 8)}…
                              {hasMismatch && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-foreground text-sm">{r.booking.full_name}</p>
                            </TableCell>
                            <TableCell className="text-sm">{r.tripName}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(r.booking.total_amount)}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {r.totalPaymentReceived > 0 ? formatCurrency(r.totalPaymentReceived) : formatCurrency(r.booking.advance_paid)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {r.booking.payment_status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {r.totalRefundAmount > 0 ? (
                                <span className="text-red-600 font-medium">-{formatCurrency(r.totalRefundAmount)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(r.totalPaymentReceived > 0 ? r.netRevenue : r.booking.advance_paid)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(r.booking.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {reconciliationData.length > 0 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border text-sm">
                  <span className="text-muted-foreground">{reconciliationData.length} records</span>
                  <div className="flex gap-6 font-medium">
                    <span>Total Booked: {formatCurrency(reconciliationData.reduce((s, r) => s + r.booking.total_amount, 0))}</span>
                    <span className="text-green-600">
                      Collected: {formatCurrency(reconciliationData.reduce((s, r) => s + (r.totalPaymentReceived > 0 ? r.totalPaymentReceived : r.booking.advance_paid), 0))}
                    </span>
                    <span className="text-red-600">
                      Refunded: {formatCurrency(reconciliationData.reduce((s, r) => s + r.totalRefundAmount, 0))}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refund History */}
        <TabsContent value="refunds">
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Refund Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Processed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No refunds recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      refunds.map((r) => {
                        const rel = bookings.find((b) => b.id === r.booking_id);
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <p className="text-sm font-medium">{tripMap[rel?.trip_id || ""]?.trip_name || rel?.trip_id || "—"}</p>
                              <p className="text-xs text-muted-foreground font-mono">{r.booking_id.slice(0, 8)}…</p>
                            </TableCell>
                            <TableCell className="text-sm">{rel?.full_name || "—"}</TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                              {formatCurrency(Number(r.amount))}
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{r.reason || "—"}</TableCell>
                            <TableCell>
                              <Badge className={r.refund_status === "processed"
                                ? "bg-green-500/20 text-green-600 border-green-500/30"
                                : "bg-amber-500/20 text-amber-600 border-amber-500/30"
                              }>
                                {r.refund_status === "processed" ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" />Processed</>
                                ) : (
                                  "Pending"
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                            <TableCell className="text-xs">
                              {r.processed_at ? (
                                <span className="text-green-600">{formatDate(r.processed_at)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(FinancialReconciliation);
