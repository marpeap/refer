import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rates = await query(
    'SELECT pack_name, commission_amount FROM commission_rates ORDER BY pack_name'
  );
  return NextResponse.json(rates);
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rates: { pack_name: string; commission_amount: number }[] = await req.json();

    for (const { pack_name, commission_amount } of rates) {
      await query(
        `INSERT INTO commission_rates (pack_name, commission_amount, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (pack_name) DO UPDATE SET commission_amount = $2, updated_at = NOW()`,
        [pack_name, commission_amount]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
