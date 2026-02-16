import { useMemo, useState, memo } from "react";
import { format, parseISO, startOfMonth, isWithinInterval } from "date-fns";
import { TrendingUp, IndianRupee, Users, ShoppingBag, BarChart3, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { calculateDynamicPrice } from "@/lib/dynamicPricing";
import { formatPrice } from "@/data/trips";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface Booking {
  id: string;
  trip_id: string;
  batch_id: string | null;
  full_name: string;
  num_travelers: number;
  total_amount: number;
  advance_paid: number;
  booking_status: string;
  payment_status: string;
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
  available_seats?: number | null;
  status: string;
}

interface AdminAnalyticsProps {
  bookings: Booking[];
  batches: Batch[];
  trips: { trip_id: string; trip_name: string; destination_id: string | null }[];
  destinations: { id: string; name: string }[];
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  basePrice: {
    label: "Base Price",
    color: "hsl(var(--muted-foreground))",
  },
  effectivePrice: {
    label: "Effective Price",
    color: "hsl(var(--primary))",
  },
};

const AdminAnalytics = ({ bookings, batches, trips, destinations }: AdminAnalyticsProps) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [tripFilter, setTripFilter] = useState("all");

  // Build lookup maps
  const tripMap = useMemo(() => {
    const m: Record<string, { trip_name: string; destination_id: string | null }> = {};
    trips.forEach(t => { m[t.trip_id] = { trip_name: t.trip_name, destination_id: t.destination_id }; });
    return m;
  }, [trips]);

  const destMap = useMemo(() => {
    const m: Record<string, string> = {};
    destinations.forEach(d => { m[d.id] = d.name; });
    return m;
  }, [destinations]);

  // Filter confirmed bookings with date/destination/trip filters
  const confirmedBookings = useMemo(() => {
    return bookings.filter(b => {
      if (b.booking_status !== "confirmed") return false;

      if (dateFrom || dateTo) {
        const d = parseISO(b.created_at);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }

      const trip = tripMap[b.trip_id];
      if (destinationFilter !== "all" && trip?.destination_id !== destinationFilter) return false;
      if (tripFilter !== "all" && b.trip_id !== tripFilter) return false;

      return true;
    });
  }, [bookings, dateFrom, dateTo, destinationFilter, tripFilter, tripMap]);

  // Revenue overview
  const totalRevenue = useMemo(() => confirmedBookings.reduce((s, b) => s + b.total_amount, 0), [confirmedBookings]);
  const totalBookings = confirmedBookings.length;
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  const totalTravelers = useMemo(() => confirmedBookings.reduce((s, b) => s + b.num_travelers, 0), [confirmedBookings]);

  // Monthly revenue chart
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    confirmedBookings.forEach(b => {
      const key = format(parseISO(b.created_at), "yyyy-MM");
      map[key] = (map[key] || 0) + b.total_amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: format(parseISO(month + "-01"), "MMM yy"),
        revenue,
      }));
  }, [confirmedBookings]);

  // Destination performance
  const destPerformance = useMemo(() => {
    const map: Record<string, { name: string; bookings: number; revenue: number }> = {};
    confirmedBookings.forEach(b => {
      const trip = tripMap[b.trip_id];
      const destId = trip?.destination_id || "unknown";
      const destName = destId !== "unknown" ? (destMap[destId] || "Unknown") : "Unknown";
      if (!map[destId]) map[destId] = { name: destName, bookings: 0, revenue: 0 };
      map[destId].bookings++;
      map[destId].revenue += b.total_amount;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [confirmedBookings, tripMap, destMap]);

  // Inventory overview
  const inventoryData = useMemo(() => {
    return batches.map(batch => {
      const totalCapacity = batch.batch_size;
      const sold = batch.seats_booked;
      const available = batch.available_seats ?? (totalCapacity - sold);
      const occupancy = totalCapacity > 0 ? Math.round((sold / totalCapacity) * 100) : 0;
      const tripName = tripMap[batch.trip_id]?.trip_name || batch.trip_id;

      return {
        ...batch,
        tripName,
        totalCapacity,
        sold,
        available,
        occupancy,
        isSoldOut: available <= 0,
        isFillingFast: occupancy >= 80 && available > 0,
      };
    });
  }, [batches, tripMap]);

  // Dynamic pricing chart data
  const pricingChartData = useMemo(() => {
    return batches
      .filter(b => b.status === "active")
      .map(batch => {
        const available = batch.available_seats ?? (batch.batch_size - batch.seats_booked);
        const trip = tripMap[batch.trip_id];
        const tripName = trip?.trip_name || batch.trip_id;
        const dp = calculateDynamicPrice(0, batch.batch_size, available, batch.start_date);
        // We need a base price from trips data - use price_override or 0
        const batchBasePrice = batch.batch_size; // placeholder, we compute from trips
        return {
          name: `${batch.batch_name.length > 15 ? batch.batch_name.slice(0, 15) + '…' : batch.batch_name}`,
          fullName: `${batch.batch_name} (${tripName})`,
          occupancy: batch.batch_size > 0 ? Math.round(((batch.batch_size - available) / batch.batch_size) * 100) : 0,
          adjustmentPercent: dp.adjustmentPercent,
          badges: dp.badges,
        };
      })
      .sort((a, b) => b.adjustmentPercent - a.adjustmentPercent);
  }, [batches, tripMap]);

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

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
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
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
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Destinations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations</SelectItem>
                  {destinations.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1.5">Trip</p>
              <Select value={tripFilter} onValueChange={setTripFilter}>
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
            {(dateFrom || dateTo || destinationFilter !== "all" || tripFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setDestinationFilter("all"); setTripFilter("all"); }}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
                <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(avgBookingValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Booking Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalTravelers}</p>
                <p className="text-sm text-muted-foreground">Total Travelers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Monthly Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No confirmed bookings found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Pricing Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Dynamic Pricing – Active Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pricingChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={pricingChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" domain={[-20, 25]} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`} className="text-xs" />
                <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl space-y-1">
                        <p className="font-medium">{d.fullName}</p>
                        <p className="text-muted-foreground">Occupancy: {d.occupancy}%</p>
                        <p className={d.adjustmentPercent > 0 ? "text-orange-600 font-medium" : d.adjustmentPercent < 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          Price Adjustment: {d.adjustmentPercent > 0 ? '+' : ''}{d.adjustmentPercent}%
                        </p>
                        {d.badges.map((b: { label: string; type: string }, i: number) => (
                          <span key={i} className={`inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded ${b.type === 'surge' ? 'bg-orange-500/10 text-orange-600' : 'bg-green-500/10 text-green-600'}`}>
                            {b.label}
                          </span>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="adjustmentPercent"
                  radius={[0, 4, 4, 0]}
                  fill="hsl(var(--primary))"
                  label={({ x, y, width, height, value }: any) => (
                    <text x={x + width + 4} y={y + height / 2 + 4} className="fill-foreground text-[10px] font-medium">
                      {value > 0 ? '+' : ''}{value}%
                    </text>
                  )}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No active batches found.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Destination Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Destination Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {destPerformance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destPerformance.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right">{d.bookings}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(d.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">No data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Inventory Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              Inventory Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {inventoryData.map(batch => (
                <div key={batch.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{batch.batch_name}</p>
                      <p className="text-xs text-muted-foreground">{batch.tripName}</p>
                    </div>
                    {batch.isSoldOut ? (
                      <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Sold Out</Badge>
                    ) : batch.isFillingFast ? (
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Filling Fast
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Available</Badge>
                    )}
                  </div>
                  <Progress value={batch.occupancy} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{batch.sold} / {batch.totalCapacity} sold</span>
                    <span>{batch.available} left · {batch.occupancy}%</span>
                  </div>
                </div>
              ))}
              {inventoryData.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No batches found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(AdminAnalytics);
