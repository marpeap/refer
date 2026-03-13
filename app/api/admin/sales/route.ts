import { query, pool } from '@/lib/db';
import { checkAndAwardBadges } from '@/lib/badges';

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin-auth';

function checkAdmin(req: NextRequest): boolean {
  const adminPassword = req.headers.get('x-admin-password');
  return verifyAdminPassword(adminPassword);
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
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
        s.status,
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
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { referrer_code, client_name, service, amount, admin_note } = await req.json();

    if (!referrer_code || !client_name || !service || !amount) {
      return NextResponse.json({ error: 'Tous les champs obligatoires sont requis' }, { status: 400 });
    }

    const referrerResult = await query('SELECT id, referred_by FROM referrers WHERE code = $1', [referrer_code]);
    if (referrerResult.length === 0) {
      return NextResponse.json({ error: 'Apporteur non trouvé' }, { status: 404 });
    }

    const referrer_id = referrerResult[0].id;
    const referred_by = referrerResult[0].referred_by;

    // Taux personnalisé > taux global > 0
    const customRate = await query(
      'SELECT commission_amount FROM referrer_commission_rates WHERE referrer_id = $1 AND pack_name = $2',
      [referrer_id, service]
    );
    const globalRate = await query('SELECT commission_amount FROM commission_rates WHERE pack_name = $1', [service]);
    const commission = customRate.length > 0
      ? Number(customRate[0].commission_amount)
      : globalRate.length > 0 ? Number(globalRate[0].commission_amount) : 0;

    // Transaction: INSERT sale + UPDATE tier + cascade commission
    const txClient = await pool.connect();
    let saleId: string;
    try {
      await txClient.query('BEGIN');

      const saleResult = await txClient.query(
        `INSERT INTO sales (id, referrer_id, client_name, service, amount, commission_amount, admin_note, status, source, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'confirmed', 'admin', NOW())
         RETURNING id, client_name, service, amount, commission_amount, commission_paid, paid_at, admin_note, status, created_at`,
        [referrer_id, client_name, service, amount, commission, admin_note || null]
      );
      saleId = saleResult.rows[0].id;

      // Auto-update tier
      const salesCount = await txClient.query("SELECT COUNT(*) as cnt FROM sales WHERE referrer_id = $1 AND status = 'confirmed'", [referrer_id]);
      const count = Number(salesCount.rows[0]?.cnt ?? 0);
      const tier = count >= 10 ? 'gold' : count >= 3 ? 'silver' : 'bronze';
      await txClient.query('UPDATE referrers SET tier = $1 WHERE id = $2', [tier, referrer_id]);

      // Cascade commission (MLM niveau 1)
      if (referred_by && commission > 0) {
        const parrainResult = await txClient.query(
          "SELECT id FROM referrers WHERE id = $1 AND status = 'active'",
          [referred_by]
        );
        if (parrainResult.rows.length > 0) {
          const rateResult = await txClient.query('SELECT rate FROM cascade_rate WHERE id = 1');
          const cascadeRate = Number(rateResult.rows[0]?.rate ?? 5);
          const cascadeAmount = Math.round(commission * cascadeRate) / 100;
          if (cascadeAmount > 0) {
            await txClient.query(`
              INSERT INTO cascade_commissions (sale_id, referrer_id, filleul_id, amount)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (sale_id, referrer_id) DO NOTHING
            `, [saleId, referred_by, referrer_id, cascadeAmount]);
          }
        }
      }

      await txClient.query('COMMIT');

      // Side-effects after commit: badges
      checkAndAwardBadges(referrer_id).catch(() => {});

      return NextResponse.json(saleResult.rows[0], { status: 201 });
    } catch (txError) {
      await txClient.query('ROLLBACK');
      throw txError;
    } finally {
      txClient.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la vente' }, { status: 500 });
  }
}
