import { useRef } from "react";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";
import { generateUpiQrString, getMerchantUpiId } from "@/lib/upi";

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
    notes?: string | null;
    created_at: string;
  };
  batchInfo?: { batch_name: string; start_date: string; end_date: string } | null;
  tripName?: string;
  /** Optional override for the customer's full address (single line). */
  customerAddress?: string | null;
}

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));

const InvoiceView = ({ booking, batchInfo, tripName, customerAddress }: InvoiceProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const qty = Math.max(1, booking.num_travelers || 1);
  const pricePerPerson = Math.round((booking.total_amount || 0) / qty);
  const lineTotal = pricePerPerson * qty;
  const advancePaid = Math.max(0, booking.advance_paid || 0);
  const subTotal = Math.max(0, lineTotal - advancePaid); // amount still due
  const balanceDue = subTotal;
  const isFullyPaid = balanceDue <= 0;

  const invoiceNumber =
    booking.invoice_number || `GB-${booking.id.slice(0, 8).toUpperCase()}`;

  // Pricing tier label, if stored in notes ("Option: ...")
  const tierLabel = (() => {
    const m = booking.notes?.match(/Option:\s*([^|]+)/i);
    return m ? m[1].trim() : null;
  })();

  const upiQr = generateUpiQrString({
    amount: balanceDue > 0 ? balanceDue : lineTotal,
    transactionNote: `GoBhraman ${tripName || booking.trip_id} ${invoiceNumber}`,
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice ${invoiceNumber}</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; color: #1a1a1a; background: #fafaf7; }
        .invoice { max-width: 780px; margin: 0 auto; background: #fafaf7; padding: 24px; }
        .script { font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; color: #f0b429; font-size: 36px; line-height: 1; }
        .title { font-size: 44px; font-weight: 800; letter-spacing: -1px; margin-top: -4px; }
        .billed h3, .pay h3 { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
        .billed p, .pay p { font-size: 13px; margin: 2px 0; color: #1a1a1a; }
        .pay { text-align: right; }
        table.items { width: 100%; border-collapse: collapse; margin: 24px 0 8px; }
        table.items th { background: #ffe082; padding: 12px 14px; text-align: left; font-size: 12px; letter-spacing: 1px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; }
        table.items td { padding: 12px 14px; font-size: 14px; }
        .row-adv td { background: #fff8e1; }
        .row-sub td { background: #ffe082; font-weight: 700; }
        .text-right { text-align: right; }
        .breakdown { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .breakdown td { padding: 12px 14px; font-size: 14px; background: #f5e6d3; }
        .breakdown tr.alt td { background: #efe0cb; }
        .breakdown tr.bold td { font-weight: 700; }
        .terms { margin-top: 28px; }
        .terms h4 { color: #b45309; font-weight: 700; margin: 0 0 6px; font-size: 13px; letter-spacing: 1px; }
        .terms p { font-size: 13px; margin: 2px 0; }
        .bank-row { display: flex; gap: 24px; margin-top: 28px; align-items: flex-start; }
        .bank-row .bank { flex: 1; font-size: 14px; line-height: 1.8; }
        .bank-row .qr { text-align: center; }
        .upi-pill { display: inline-block; background: #f0b429; color: #1a1a1a; font-weight: 700; padding: 8px 18px; border-radius: 999px; margin-top: 10px; font-size: 14px; }
        .logo-block { display: flex; flex-direction: column; align-items: flex-end; }
        .logo-block img { width: 90px; height: 90px; object-fit: contain; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; }
        .meta { font-size: 12px; color: #555; margin-top: 6px; text-align: right; }
        .pagebreak { page-break-after: always; }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const Page = ({ children }: { children: React.ReactNode }) => (
    <div className="invoice" style={{ background: "#fafaf7", padding: 28, borderRadius: 12 }}>
      {/* Header */}
      <div className="header">
        <div>
          <div className="script">Travel</div>
          <div className="title">INVOICE</div>
        </div>
        <div className="logo-block">
          <img src={logo} alt="GoBhraman" />
          <div className="meta">
            <div>#{invoiceNumber}</div>
            <div>Date: {format(new Date(booking.created_at), "dd MMM yyyy")}</div>
          </div>
        </div>
      </div>

      {/* Billed / Payment To */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 24 }}>
        <div className="billed" style={{ flex: 1 }}>
          <h3>Billed To : {booking.full_name}</h3>
          <p>{booking.phone}</p>
          {customerAddress && <p>{customerAddress}</p>}
          {booking.pickup_location && !customerAddress && <p>Pickup: {booking.pickup_location}</p>}
          <p>{booking.email}</p>
        </div>
        <div className="pay" style={{ flex: 1 }}>
          <h3>Payment To : Utkarsh Varma</h3>
          <p>+91 94150 26522</p>
          <p>Payment Via UPI</p>
        </div>
      </div>

      {children}

      {/* Terms */}
      <div className="terms">
        <h4>TERMS AND CONDITIONS</h4>
        <p>50% Advance on booking confirms your seat.</p>
        <p>Full balance must be cleared before trip departure.</p>
        <p>Cancellations within 48 hours of departure are non-refundable.</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print / Download PDF
        </Button>
      </div>

      <div ref={printRef}>
        {/* Page 1 — Invoice */}
        <Page>
          {/* Items table */}
          <table className="items">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Description</th>
                <th className="text-right" style={{ width: "10%" }}>Qty</th>
                <th className="text-right" style={{ width: "20%" }}>Price</th>
                <th className="text-right" style={{ width: "20%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: 600 }}>{tripName || booking.trip_id}</div>
                  {batchInfo && (
                    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                      {batchInfo.batch_name} • {format(new Date(batchInfo.start_date), "dd MMM")} – {format(new Date(batchInfo.end_date), "dd MMM yyyy")}
                    </div>
                  )}
                  {tierLabel && (
                    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Option: {tierLabel}</div>
                  )}
                </td>
                <td className="text-right">{qty}</td>
                <td className="text-right">{fmtINR(pricePerPerson)} Rs</td>
                <td className="text-right">{fmtINR(lineTotal)} Rs</td>
              </tr>
              {advancePaid > 0 && (
                <tr className="row-adv">
                  <td colSpan={3}>Advance</td>
                  <td className="text-right">- {fmtINR(advancePaid)} Rs</td>
                </tr>
              )}
              <tr className="row-sub">
                <td colSpan={3} className="text-right">SUB TOTAL :</td>
                <td className="text-right">{fmtINR(subTotal)} Rs</td>
              </tr>
            </tbody>
          </table>

          {/* Breakdown card */}
          <table className="breakdown">
            <tbody>
              <tr>
                <td>Total amount</td>
                <td className="text-right">{fmtINR(lineTotal)} Rs</td>
              </tr>
              <tr className="alt">
                <td>Advance paid</td>
                <td className="text-right">- {fmtINR(advancePaid)} Rs</td>
              </tr>
              <tr className="bold">
                <td>{isFullyPaid ? "Status" : "Pending balance"}</td>
                <td className="text-right">{isFullyPaid ? "FULLY PAID" : `${fmtINR(balanceDue)} Rs`}</td>
              </tr>
            </tbody>
          </table>
        </Page>

        {/* Page 2 — Payment details */}
        {!isFullyPaid && (
          <>
            <div className="pagebreak" />
            <div style={{ marginTop: 24 }}>
              <Page>
                <div className="bank-row">
                  <div className="bank">
                    <p><strong>Account holder name:</strong><br /> Utkarsh Kartika Prasad Verma</p>
                    <p><strong>Account number:</strong> 188433676328</p>
                    <p><strong>IFSC code:</strong> INDB0000430</p>
                    <p><strong>Branch:</strong> Kalbadevi</p>
                    <div className="upi-pill">{getMerchantUpiId()}</div>
                  </div>
                  <div className="qr">
                    <div style={{ background: "#fff", padding: 12, borderRadius: 12, display: "inline-block" }}>
                      <QRCodeSVG value={upiQr} size={200} level="M" includeMargin />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
                      Scan to pay ₹{fmtINR(balanceDue)}
                    </div>
                  </div>
                </div>
              </Page>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceView;
