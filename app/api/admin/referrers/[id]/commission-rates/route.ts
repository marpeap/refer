import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

// GET  — taux personnalisés de l'apporteur, fusionnés avec les taux globaux
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const globals = await query(
    'SELECT pack_name, commission_amount FROM commission_rates ORDER BY pack_name'
  );

  const overrides = await query(
    'SELECT pack_name, commission_amount FROM referrer_commission_rates WHERE referrer_id = $1',
    [params.id]
  );

  const overrideMap = Object.fromEntries(overrides.map(r => [r.pack_name, r.commission_amount]));

  const merged = globals.map(g => ({
    pack_name: g.pack_name,
    commission_amount: overrideMap[g.pack_name] ?? g.commission_amount,
    is_custom: g.pack_name in overrideMap,
  }));

  return NextResponse.json(merged);
}

// PUT  — sauvegarde les taux personnalisés (upsert)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const rates: { pack_name: string; commission_amount: number }[] = await req.json();

    for (const { pack_name, commission_amount } of rates) {
      await query(
        `INSERT INTO referrer_commission_rates (referrer_id, pack_name, commission_amount, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (referrer_id, pack_name) DO UPDATE SET commission_amount = $3, updated_at = NOW()`,
        [params.id, pack_name, commission_amount]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — supprime les overrides (revient aux taux globaux)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  await query('DELETE FROM referrer_commission_rates WHERE referrer_id = $1', [params.id]);
  return NextResponse.json({ ok: true });
}
