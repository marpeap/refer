import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { month: string } }
) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { month } = params; // 'YYYY-MM'
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month format (YYYY-MM)' }, { status: 400 });
  }

  const [year, mon] = month.split('-');
  const monthLabel = new Date(Number(year), Number(mon) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const referrers = await query(
    'SELECT full_name, email, code FROM referrers WHERE id = $1',
    [payload.id]
  );
  if (referrers.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const referrer = referrers[0];

  const sales = await query(
    `SELECT client_name, service, amount, commission_amount, created_at
     FROM sales
     WHERE referrer_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2
     ORDER BY created_at ASC`,
    [payload.id, month]
  );

  const totalCommission = sales.reduce((s: number, r: any) => s + Number(r.commission_amount), 0);
  const totalAmount = sales.reduce((s: number, r: any) => s + Number(r.amount), 0);

  // Generate PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const darkBg = rgb(0.031, 0.031, 0.063); // #080810
  const accent = rgb(0.357, 0.431, 0.961); // #5B6EF5
  const green = rgb(0.18, 0.835, 0.443);  // #2ED573
  const white = rgb(1, 1, 1);
  const muted = rgb(0.6, 0.6, 0.6);

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: darkBg });

  // Header band
  page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: rgb(0.09, 0.09, 0.18) });

  // Logo text
  page.drawText('mar', { x: 40, y: height - 60, size: 28, font: fontBold, color: white });
  page.drawText('peap', { x: 40 + fontBold.widthOfTextAtSize('mar', 28), y: height - 60, size: 28, font: fontBold, color: accent });

  // Title
  page.drawText(`Relevé de commissions`, { x: 40, y: height - 85, size: 12, font: fontReg, color: muted });
  page.drawText(`${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`, { x: width - 150, y: height - 55, size: 16, font: fontBold, color: white });

  // Referrer info
  let y = height - 130;
  page.drawText('Apporteur', { x: 40, y, size: 10, font: fontReg, color: muted });
  y -= 18;
  page.drawText(referrer.full_name, { x: 40, y, size: 14, font: fontBold, color: white });
  y -= 16;
  page.drawText(`Code : ${referrer.code}`, { x: 40, y, size: 10, font: fontReg, color: muted });
  y -= 8;
  page.drawText(referrer.email, { x: 40, y, size: 10, font: fontReg, color: muted });

  // Summary box
  y -= 36;
  page.drawRectangle({ x: 40, y: y - 50, width: width - 80, height: 60, color: rgb(0.06, 0.06, 0.14), borderColor: rgb(0.18, 0.835, 0.443), borderWidth: 1, borderOpacity: 0.3 });
  page.drawText('Total commissions', { x: 56, y: y - 20, size: 11, font: fontReg, color: muted });
  page.drawText(`+${totalCommission.toFixed(2)} EUR`, { x: 56, y: y - 40, size: 22, font: fontBold, color: green });
  page.drawText(`${sales.length} vente${sales.length !== 1 ? 's' : ''} · CA total ${totalAmount.toFixed(2)} EUR`, {
    x: width - 260, y: y - 30, size: 10, font: fontReg, color: muted
  });

  // Table header
  y -= 80;
  const colX = [40, 130, 240, 340, width - 120];
  const headers = ['Date', 'Client', 'Service', 'Montant', 'Commission'];
  page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: rgb(0.12, 0.12, 0.22) });
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX[i] + 4, y: y + 4, size: 9, font: fontBold, color: muted });
  });

  y -= 20;
  for (const sale of sales) {
    if (y < 80) {
      // TODO: add page if needed
      break;
    }
    const rowData = [
      new Date(sale.created_at).toLocaleDateString('fr-FR'),
      sale.client_name.length > 18 ? sale.client_name.slice(0, 16) + '…' : sale.client_name,
      sale.service,
      `${Number(sale.amount).toFixed(2)} €`,
      `+${Number(sale.commission_amount).toFixed(2)} €`,
    ];
    rowData.forEach((d, i) => {
      const color = i === 4 ? green : white;
      const font = i === 4 ? fontBold : fontReg;
      page.drawText(d, { x: colX[i] + 4, y: y + 2, size: 9, font, color });
    });
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.15, 0.15, 0.25) });
    y -= 22;
  }

  // Footer
  page.drawLine({ start: { x: 40, y: 60 }, end: { x: width - 40, y: 60 }, thickness: 0.5, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Marpeap · refer.marpeap.digital · Document généré automatiquement', {
    x: 40, y: 40, size: 9, font: fontReg, color: muted
  });
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, {
    x: width - 160, y: 40, size: 9, font: fontReg, color: muted
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="releve-${month}.pdf"`,
    },
  });
}
