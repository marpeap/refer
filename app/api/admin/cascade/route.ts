import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rateRow] = await query('SELECT rate FROM cascade_rate WHERE id = 1');
  const rate = Number(rateRow?.rate ?? 5);

  const commissions = await query(`
    SELECT
      cc.id, cc.amount, cc.paid, cc.paid_at, cc.created_at,
      s.client_name, s.service,
      parrain.full_name AS parrain_name, parrain.code AS parrain_code,
      filleul.full_name AS filleul_name, filleul.code AS filleul_code
    FROM cascade_commissions cc
    JOIN sales s ON s.id = cc.sale_id
    JOIN referrers parrain ON parrain.id = cc.referrer_id
    JOIN referrers filleul ON filleul.id = cc.filleul_id
    ORDER BY cc.created_at DESC
  `);

  return NextResponse.json({
    rate,
    commissions: commissions.map((c: any) => ({
      id: c.id,
      amount: Number(c.amount),
      paid: c.paid,
      paid_at: c.paid_at,
      created_at: c.created_at,
      sale: { client_name: c.client_name, service: c.service },
      parrain: { name: c.parrain_name, code: c.parrain_code },
      filleul: { name: c.filleul_name, code: c.filleul_code },
    })),
  });
}

export async function PUT(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rate } = await req.json();
  if (rate === undefined || Number(rate) < 0 || Number(rate) > 100) {
    return NextResponse.json({ error: 'Invalid rate (0-100)' }, { status: 400 });
  }

  await query(
    'UPDATE cascade_rate SET rate = $1, updated_at = NOW() WHERE id = 1',
    [Number(rate)]
  );

  return NextResponse.json({ ok: true, rate: Number(rate) });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await query(
    'UPDATE cascade_commissions SET paid = true, paid_at = NOW() WHERE id = $1',
    [id]
  );

  return NextResponse.json({ ok: true });
}
