import { query } from '@/lib/db';

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(req: NextRequest): boolean {
  const adminPassword = req.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminPassword(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const result = await query(`
      SELECT
        s.id,
        s.client_name,
        s.service,
        s.amount,
        s.commission_amount,
        s.commission_paid,
        s.paid_at,
        s.admin_note,
        s.created_at,
        r.full_name as referrer_name,
        r.code as referrer_code
      FROM sales s
      JOIN referrers r ON s.referrer_id = r.id
      ORDER BY s.created_at DESC
    `);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des ventes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminPassword(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { referrer_code, client_name, service, amount, admin_note } = await req.json();

    if (!referrer_code || !client_name || !service || !amount) {
      return NextResponse.json({ error: 'Tous les champs obligatoires sont requis' }, { status: 400 });
    }

    const referrerResult = await query('SELECT id FROM referrers WHERE code = $1', [referrer_code]);
    if (referrerResult.length === 0) {
      return NextResponse.json({ error: 'Apporteur non trouvé' }, { status: 404 });
    }

    const referrer_id = referrerResult[0].id;

    // Taux personnalisé > taux global > 0
    const customRate = await query(
      'SELECT commission_amount FROM referrer_commission_rates WHERE referrer_id = $1 AND pack_name = $2',
      [referrer_id, service]
    );
    const globalRate = await query('SELECT commission_amount FROM commission_rates WHERE pack_name = $1', [service]);
    const commission = customRate.length > 0
      ? Number(customRate[0].commission_amount)
      : globalRate.length > 0 ? Number(globalRate[0].commission_amount) : 0;

    const saleResult = await query(
      `INSERT INTO sales (id, referrer_id, client_name, service, amount, commission_amount, admin_note, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, client_name, service, amount, commission_amount, commission_paid, paid_at, admin_note, created_at`,
      [referrer_id, client_name, service, amount, commission, admin_note || null]
    );

    // Auto-update tier
    const salesCount = await query('SELECT COUNT(*) as cnt FROM sales WHERE referrer_id = $1', [referrer_id]);
    const count = Number(salesCount[0].cnt);
    const tier = count >= 10 ? 'gold' : count >= 3 ? 'silver' : 'bronze';
    await query('UPDATE referrers SET tier = $1 WHERE id = $2', [tier, referrer_id]);

    return NextResponse.json(saleResult[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la vente' }, { status: 500 });
  }
}
