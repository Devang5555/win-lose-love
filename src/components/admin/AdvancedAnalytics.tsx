import { useMemo, memo } from "react";
import { TrendingUp, IndianRupee, Users, Target, Percent, ArrowDownRight, Gift, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Booking {
  id: string;
  trip_id: string;
  batch_id: string | null;
  num_travelers: number;
  total_amount: number;
  advance_paid: number;
  booking_status: string;
  payment_status: string;
  wallet_discount?: number | null;
  referral_code_used?: string | null;
}

interface Props {
  bookings: Booking[];
  trips: { trip_id: string; trip_name: string; destination_id: string | null }[];
  destinations: { id: string; name: string }[];
  leads: { id: string; status: string; source: string }[];
}

const COLORS = ["hsl(200 95% 45%)", "hsl(20 95% 55%)", "hsl(155 55% 35%)", "hsl(45 100% 50%)", "hsl(175 70% 40%)"];

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  advance: { label: "Advance", color: "hsl(var(--chart-1))" },
  balance: { label: "Balance", color: "hsl(var(--chart-2))" },
};

const AdvancedAnalytics = ({ bookings, trips, destinations, leads }: Props) => {
  const tripMap = useMemo(() => {
    const m: Record<string, { name: string; dest_id: string | null }> = {};
    trips.forEach(t => { m[t.trip_id] = { name: t.trip_name, dest_id: t.destination_id }; });
    return m;
  }, [trips]);

  const destMap = useMemo(() => {
    const m: Record<string, string> = {};
    destinations.forEach(d => { m[d.id] = d.name; });
    return m;
  }, [destinations]);

  const confirmed = useMemo(() => bookings.filter(b => b.booking_status === "confirmed"), [bookings]);
  const initiated = useMemo(() => bookings.filter(b => b.booking_status === "initiated" || b.booking_status === "pending"), [bookings]);

  // 1. Conversion Metrics
  const totalInitiated = bookings.length;
  const totalConfirmed = confirmed.length;
  const conversionRate = totalInitiated > 0 ? ((totalConfirmed / totalInitiated) * 100).toFixed(1) : "0";
  const abandonmentRate = totalInitiated > 0 ? (((totalInitiated - totalConfirmed) / totalInitiated) * 100).toFixed(1) : "0";

  // 2. Revenue per Trip
  const revenueByTrip = useMemo(() => {
    const map: Record<string, { revenue: number; advance: number; balance: number; count: number }> = {};
    confirmed.forEach(b => {
      const id = b.trip_id;
      if (!map[id]) map[id] = { revenue: 0, advance: 0, balance: 0, count: 0 };
      map[id].revenue += b.total_amount;
      map[id].advance += b.advance_paid;
      map[id].balance += (b.total_amount - b.advance_paid);
      map[id].count++;
    });
    return Object.entries(map)
      .map(([trip_id, d]) => ({ trip_id, name: tripMap[trip_id]?.name || trip_id, ...d }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [confirmed, tripMap]);

  // Revenue per Destination
  const revenueByDest = useMemo(() => {
    const map: Record<string, { name: string; revenue: number }> = {};
    confirmed.forEach(b => {
      const destId = tripMap[b.trip_id]?.dest_id || "unknown";
      const name = destId !== "unknown" ? (destMap[destId] || "Unknown") : "Unknown";
      if (!map[destId]) map[destId] = { name, revenue: 0 };
      map[destId].revenue += b.total_amount;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [confirmed, tripMap, destMap]);

  // Advance vs Balance split
  const totalRevenue = confirmed.reduce((s, b) => s + b.total_amount, 0);
  const totalAdvance = confirmed.reduce((s, b) => s + b.advance_paid, 0);
  const totalBalance = totalRevenue - totalAdvance;
  const walletUsage = confirmed.filter(b => (b.wallet_discount || 0) > 0).length;
  const walletPercent = totalConfirmed > 0 ? ((walletUsage / totalConfirmed) * 100).toFixed(0) : "0";

  // 3. Lead Intelligence
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const leadConversion = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
  const leadsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { map[l.source] = (map[l.source] || 0) + 1; });
    return Object.entries(map).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  }, [leads]);

  // 4. Referral/Affiliate Performance
  const referralBookings = useMemo(() => {
    const map: Record<string, number> = {};
    confirmed.filter(b => b.referral_code_used).forEach(b => {
      const code = b.referral_code_used!;
      map[code] = (map[code] || 0) + 1;
    });
    return Object.entries(map).map(([code, count]) => ({ code, count, commission: count * 250 })).sort((a, b) => b.count - a.count);
  }, [confirmed]);

  const advanceBalancePie = [
    { name: "Advance Collected", value: totalAdvance },
    { name: "Balance Pending", value: totalBalance },
  ];

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Conversion & Abandonment */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{totalInitiated}</p><p className="text-sm text-muted-foreground">Total Bookings</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"><Target className="w-5 h-5 text-green-500" /></div><div><p className="text-2xl font-bold text-foreground">{totalConfirmed}</p><p className="text-sm text-muted-foreground">Confirmed</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><Percent className="w-5 h-5 text-accent" /></div><div><p className="text-2xl font-bold text-foreground">{conversionRate}%</p><p className="text-sm text-muted-foreground">Conversion Rate</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><ArrowDownRight className="w-5 h-5 text-red-500" /></div><div><p className="text-2xl font-bold text-foreground">{abandonmentRate}%</p><p className="text-sm text-muted-foreground">Abandonment</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"><Gift className="w-5 h-5 text-purple-500" /></div><div><p className="text-2xl font-bold text-foreground">{walletPercent}%</p><p className="text-sm text-muted-foreground">Wallet Usage</p></div></div></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Per Trip */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><IndianRupee className="w-5 h-5 text-primary" />Revenue per Trip</CardTitle></CardHeader>
          <CardContent>
            {revenueByTrip.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={revenueByTrip.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(v as number)} />} />
                  <Bar dataKey="advance" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="balance" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  <Legend />
                </BarChart>
              </ChartContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-8">No data</p>}
          </CardContent>
        </Card>

        {/* Advance vs Balance Pie */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Advance vs Balance Split</CardTitle></CardHeader>
          <CardContent>
            {totalRevenue > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <PieChart>
                  <Pie data={advanceBalancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {advanceBalancePie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(v as number)} />} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-8">No data</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Destination */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Revenue by Destination</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Destination</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
              <TableBody>
                {revenueByDest.map((d, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{d.name}</TableCell><TableCell className="text-right font-medium">{fmt(d.revenue)}</TableCell></TableRow>
                ))}
                {revenueByDest.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Lead Intelligence */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Lead Intelligence</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold text-foreground">{totalLeads}</p><p className="text-xs text-muted-foreground">Total Leads</p></div>
              <div><p className="text-2xl font-bold text-foreground">{convertedLeads}</p><p className="text-xs text-muted-foreground">Converted</p></div>
              <div><p className="text-2xl font-bold text-foreground">{leadConversion}%</p><p className="text-xs text-muted-foreground">Conversion</p></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Source</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
              <TableBody>
                {leadsBySource.map((l, i) => (
                  <TableRow key={i}><TableCell className="capitalize">{l.source}</TableCell><TableCell className="text-right">{l.count}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Referral Performance */}
      {referralBookings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Gift className="w-5 h-5 text-primary" />Referral / Affiliate Performance</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Referral Code</TableHead><TableHead className="text-right">Bookings</TableHead><TableHead className="text-right">Commission Owed</TableHead></TableRow></TableHeader>
              <TableBody>
                {referralBookings.map((r, i) => (
                  <TableRow key={i}><TableCell className="font-mono font-medium">{r.code}</TableCell><TableCell className="text-right">{r.count}</TableCell><TableCell className="text-right font-medium">{fmt(r.commission)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(AdvancedAnalytics);
