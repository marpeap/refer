import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAndAwardBadges } from '@/lib/badges';
import { sendPushNotif } from '@/lib/push';
import { BADGE_DEFINITIONS } from '@/lib/badges';

export const runtime = 'nodejs';

async function sendSaleEmail(referrerEmail: string, referrerName: string, clientName: string, service: string, amount: number, commission: number) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Marpeap <noreply@marpeap.digital>',
        to: referrerEmail,
        subject: `🎉 +${commission}€ de commission — ${service} vendu !`,
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #080810; color: #fff; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, rgba(91,110,245,0.3), rgba(155,91,245,0.2)); padding: 32px 32px 24px;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">mar<span style="color: #5B6EF5;">peap</span></div>
            </div>
            <div style="padding: 32px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800;">Nouvelle vente enregistrée 🎉</h2>
              <p style="margin: 0 0 28px; color: rgba(255,255,255,0.5); font-size: 14px;">Bonjour ${referrerName}, bonne nouvelle !</p>
              <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                  <span style="color: rgba(255,255,255,0.4);">Service vendu</span>
                  <span style="font-weight: 600;">${service}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                  <span style="color: rgba(255,255,255,0.4);">Client</span>
                  <span>${clientName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                  <span style="color: rgba(255,255,255,0.4);">Montant</span>
                  <span>${amount.toLocaleString('fr-FR')} €</span>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.07); margin: 16px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800;">
                  <span style="color: rgba(255,255,255,0.6);">Votre commission</span>
                  <span style="color: #2ED573;">+${commission} €</span>
                </div>
              </div>
              <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 24px;">Cette commission vous sera versée par virement. Suivez l'état de vos paiements depuis votre tableau de bord.</p>
              <a href="https://refer.marpeap.digital/dashboard" style="display: inline-block; padding: 12px 28px; background: #5B6EF5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Voir mon tableau de bord →</a>
            </div>
          </div>
        `,
      }),
    });
  } catch {
    // Email failure is non-blocking
  }
}

async function checkChallenges(referrerId: string, month: string): Promise<void> {
  const challenges = await query(`
    SELECT c.id, c.title, c.condition_type, c.condition_value, c.bonus_amount
    FROM challenges c
    LEFT JOIN challenge_completions cc ON cc.challenge_id = c.id AND cc.referrer_id = $1
    WHERE c.active = true AND c.month = $2 AND cc.referrer_id IS NULL
  `, [referrerId, month]);

  if (challenges.length === 0) return;

  // Fetch stats needed for challenge evaluation
  const [salesCountRow] = await query(
    'SELECT COUNT(*) AS cnt FROM sales WHERE referrer_id = $1',
    [referrerId]
  );
  const salesCount = Number(salesCountRow?.cnt ?? 0);

  const [monthAmountRow] = await query(
    `SELECT COALESCE(SUM(commission_amount), 0) AS total FROM sales
     WHERE referrer_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2`,
    [referrerId, month]
  );
  const monthAmount = Number(monthAmountRow?.total ?? 0);

  const monthSalesByService = await query(
    `SELECT service, COUNT(*) AS cnt FROM sales
     WHERE referrer_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2
     GROUP BY service`,
    [referrerId, month]
  );
  const serviceMap: Record<string, number> = {};
  monthSalesByService.forEach((r: any) => { serviceMap[r.service] = Number(r.cnt); });

  const [monthSalesRow] = await query(
    `SELECT COUNT(*) AS cnt FROM sales WHERE referrer_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2`,
    [referrerId, month]
  );
  const monthSalesCount = Number(monthSalesRow?.cnt ?? 0);

  for (const challenge of challenges) {
    const { condition_type, condition_value } = challenge;
    let completed = false;

    if (condition_type === 'sales_count') {
      completed = monthSalesCount >= Number(condition_value.count ?? condition_value);
    } else if (condition_type === 'service_sold') {
      completed = (serviceMap[condition_value.service] ?? 0) >= (condition_value.count ?? 1);
    } else if (condition_type === 'amount_total') {
      completed = monthAmount >= Number(condition_value.amount ?? condition_value);
    }

    if (completed) {
      await query(`
        INSERT INTO challenge_completions (referrer_id, challenge_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [referrerId, challenge.id]);

      sendPushNotif(referrerId, '🎯 Challenge complété !', `${challenge.title} — +${challenge.bonus_amount}€`).catch(() => {});
    }
  }
}

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

    const referrers = await query(
      "SELECT id, full_name, email, referred_by FROM referrers WHERE code = $1 AND status = 'active'",
      [referrer_code.toUpperCase()]
    );

    if (referrers.length === 0) {
      return NextResponse.json({ error: 'Referrer not found or inactive' }, { status: 404 });
    }

    const { id: referrerId, full_name: referrerName, email: referrerEmail, referred_by: referredBy } = referrers[0];

    // Commission rate: custom > global > 0
    const customRate = await query(
      'SELECT commission_amount FROM referrer_commission_rates WHERE referrer_id = $1 AND pack_name = $2',
      [referrerId, service]
    );
    const globalRate = await query(
      'SELECT commission_amount FROM commission_rates WHERE pack_name = $1',
      [service]
    );
    const commission = customRate.length > 0
      ? Number(customRate[0].commission_amount)
      : globalRate.length > 0 ? Number(globalRate[0].commission_amount) : 0;

    const saleRows = await query(
      `INSERT INTO sales (id, referrer_id, client_name, service, amount, commission_amount, admin_note, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [referrerId, client_name, service, amount, commission, `Auto via app.marpeap.digital`]
    );
    const saleId = saleRows[0].id;

    // Auto-update tier
    const salesCount = await query('SELECT COUNT(*) as cnt FROM sales WHERE referrer_id = $1', [referrerId]);
    const count = Number(salesCount[0].cnt);
    const tier = count >= 10 ? 'gold' : count >= 3 ? 'silver' : 'bronze';
    await query('UPDATE referrers SET tier = $1 WHERE id = $2', [tier, referrerId]);

    // Cascade commission (MLM niveau 1)
    if (referredBy && commission > 0) {
      const [rateRow] = await query('SELECT rate FROM cascade_rate WHERE id = 1');
      const cascadeRate = Number(rateRow?.rate ?? 5);
      const cascadeAmount = Math.round(commission * cascadeRate) / 100;

      if (cascadeAmount > 0) {
        await query(`
          INSERT INTO cascade_commissions (sale_id, referrer_id, filleul_id, amount)
          VALUES ($1, $2, $3, $4)
        `, [saleId, referredBy, referrerId, cascadeAmount]);

        // Notify parrain
        sendPushNotif(referredBy, '💸 Commission cascade !', `${referrerName} a fait une vente — +${cascadeAmount.toFixed(2)}€`).catch(() => {});
      }
    }

    // Check and award badges
    const newBadgeIds = await checkAndAwardBadges(referrerId);
    for (const badgeId of newBadgeIds) {
      const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      if (badgeDef) {
        sendPushNotif(referrerId, `${badgeDef.icon} Badge gagné !`, badgeDef.name).catch(() => {});
      }
    }

    // Check challenges
    const currentMonth = new Date().toISOString().slice(0, 7);
    checkChallenges(referrerId, currentMonth).catch(() => {});

    // Send email (non-blocking)
    sendSaleEmail(referrerEmail, referrerName, client_name, service, amount, commission);

    return NextResponse.json({ ok: true, commission, sale_id: saleId });
  } catch (error: any) {
    console.error('Webhook sale error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
