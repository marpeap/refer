import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { referrer_code, client_name, service, amount } = await req.json();

    if (!referrer_code || !client_name || !service || amount === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Trouver l'apporteur par son code
    const referrers = await query(
      "SELECT id FROM referrers WHERE code = $1 AND status = 'active'",
      [referrer_code.toUpperCase()]
    );

    if (referrers.length === 0) {
      return NextResponse.json({ error: 'Referrer not found or inactive' }, { status: 404 });
    }

    const referrerId = referrers[0].id;

    // Récupérer la commission correspondant au service
    const rates = await query(
      'SELECT commission_amount FROM commission_rates WHERE pack_name = $1',
      [service]
    );
    const commission = rates.length > 0 ? rates[0].commission_amount : 0;

    // Enregistrer la vente
    await query(
      `INSERT INTO sales (id, referrer_id, client_name, service, amount, admin_note, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [referrerId, client_name, service, amount, `Commission: ${commission}€ · Auto via app.marpeap.digital`]
    );

    return NextResponse.json({ ok: true, commission });
  } catch (error: any) {
    console.error('Webhook sale error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
