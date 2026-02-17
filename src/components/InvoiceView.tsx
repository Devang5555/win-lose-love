import { useRef } from "react";
import { format } from "date-fns";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";

interface InvoiceProps {
  booking: {
    id: string;
    invoice_number?: string | null;
    full_name: string;
    email: string;
    phone: string;
    trip_id: string;
    pickup_location: string | null;
    num_travelers: number;
    total_amount: number;
    advance_paid: number;
    payment_status: string;
    created_at: string;
  };
  batchInfo?: { batch_name: string; start_date: string; end_date: string } | null;
  tripName?: string;
  companyConfig?: { gst_number: string; company_name: string; company_address: string; company_pan: string };
}

const InvoiceView = ({ booking, batchInfo, tripName, companyConfig }: InvoiceProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const balanceDue = Math.max(0, booking.total_amount - booking.advance_paid);
  const invoiceNumber = booking.invoice_number || `GB-${booking.id.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice ${invoiceNumber}</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 40px; color: #1a1a2e; }
        .invoice { max-width: 800px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        th { background: #f8fafc; font-weight: 600; }
        .text-right { text-align: right; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-section img { width: 48px; height: 48px; border-radius: 8px; }
        .company-name { font-size: 24px; font-weight: 700; }
        .tagline { font-size: 11px; color: #64748b; }
        .invoice-title { font-size: 28px; font-weight: 700; color: #0284c7; text-align: right; }
        .meta { font-size: 13px; color: #64748b; text-align: right; }
        .section-title { font-weight: 600; font-size: 14px; margin-top: 24px; margin-bottom: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .detail-label { font-size: 12px; color: #94a3b8; }
        .detail-value { font-size: 14px; font-weight: 500; }
        .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #0284c7; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #94a3b8; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print / Download PDF
        </Button>
      </div>

      <div ref={printRef} className="bg-white text-foreground p-8 rounded-xl border border-border max-w-[800px]">
        <div className="invoice">
          {/* Header */}
          <div className="header flex justify-between items-start mb-8">
            <div className="logo-section flex items-center gap-3">
              <img src={logo} alt="GoBhraman" className="w-12 h-12 rounded-lg" />
              <div>
                <div className="company-name text-2xl font-bold">
                  {companyConfig?.company_name || "GoBhraman"}
                </div>
                <div className="tagline text-xs text-muted-foreground">भ्रमण से मिटे भ्रम</div>
              </div>
            </div>
            <div className="text-right">
              <div className="invoice-title text-2xl font-bold text-primary">INVOICE</div>
              <div className="meta text-sm text-muted-foreground mt-1">
                <div>#{invoiceNumber}</div>
                <div>Date: {format(new Date(booking.created_at), "dd MMM yyyy")}</div>
              </div>
            </div>
          </div>

          {/* Company + Customer Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="section-title text-xs font-semibold uppercase text-muted-foreground mb-2">From</div>
              <p className="text-sm font-medium">{companyConfig?.company_name || "GoBhraman"}</p>
              <p className="text-sm text-muted-foreground">{companyConfig?.company_address || "Mumbai & Pune, India"}</p>
              {companyConfig?.gst_number && <p className="text-sm text-muted-foreground">GST: {companyConfig.gst_number}</p>}
              {companyConfig?.company_pan && <p className="text-sm text-muted-foreground">PAN: {companyConfig.company_pan}</p>}
              <p className="text-sm text-muted-foreground">Phone: +91-9415026522</p>
              <p className="text-sm text-muted-foreground">Email: bhramanbyua@gmail.com</p>
            </div>
            <div>
              <div className="section-title text-xs font-semibold uppercase text-muted-foreground mb-2">Bill To</div>
              <p className="text-sm font-medium">{booking.full_name}</p>
              <p className="text-sm text-muted-foreground">{booking.email}</p>
              <p className="text-sm text-muted-foreground">{booking.phone}</p>
              {booking.pickup_location && <p className="text-sm text-muted-foreground">Pickup: {booking.pickup_location}</p>}
            </div>
          </div>

          {/* Trip Details Table */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left text-sm font-semibold">Description</th>
                <th className="p-3 text-right text-sm font-semibold">Qty</th>
                <th className="p-3 text-right text-sm font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3">
                  <p className="text-sm font-medium">{tripName || booking.trip_id}</p>
                  {batchInfo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Batch: {batchInfo.batch_name} | {format(new Date(batchInfo.start_date), "dd MMM")} – {format(new Date(batchInfo.end_date), "dd MMM yyyy")}
                    </p>
                  )}
                </td>
                <td className="p-3 text-right text-sm">{booking.num_travelers} pax</td>
                <td className="p-3 text-right text-sm font-medium">₹{booking.total_amount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{booking.total_amount.toLocaleString("en-IN")}</span>
              </div>
              {companyConfig?.gst_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (Included)</span>
                  <span>Inclusive</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advance Paid</span>
                <span className="text-green-600 font-medium">- ₹{booking.advance_paid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-bold">Balance Due</span>
                <span className="font-bold text-lg">₹{balanceDue.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-xs text-muted-foreground text-right mt-1">
                Status: {booking.payment_status === "fully_paid" ? "✅ Fully Paid" : "⏳ Balance Pending"}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer mt-10 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            <p>Thank you for choosing GoBhraman! For support: +91-9415026522 | bhramanbyua@gmail.com</p>
            <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
