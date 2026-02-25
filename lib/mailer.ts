import { query } from './db';

export async function sendMonthlyRecap(referrerId: string, month: string): Promise<void> {
  // month format: 'YYYY-MM' ex: '2026-02'
  const [year, mon] = month.split('-');
  const monthLabel = new Date(Number(year), Number(mon) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const [referrer] = await query(
    'SELECT full_name, email, code FROM referrers WHERE id = $1',
    [referrerId]
  );
  if (!referrer) return;

  const sales = await query(
    `SELECT client_name, service, commission_amount, created_at
     FROM sales
     WHERE referrer_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2
     ORDER BY created_at ASC`,
    [referrerId, month]
  );

  const totalCommission = sales.reduce((sum: number, s: any) => sum + Number(s.commission_amount), 0);

  const badges = await query(
    `SELECT badge_id, earned_at FROM referrer_badges
     WHERE referrer_id = $1 AND TO_CHAR(earned_at, 'YYYY-MM') = $2`,
    [referrerId, month]
  );

  const [challengeRow] = await query(
    `SELECT cc.completed_at, ch.title, ch.bonus_amount
     FROM challenge_completions cc
     JOIN challenges ch ON cc.challenge_id = ch.id
     WHERE cc.referrer_id = $1 AND ch.month = $2
     LIMIT 1`,
    [referrerId, month]
  );

  const salesRows = sales.map((s: any) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); font-size: 13px;">${new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px;">${s.client_name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px;">${s.service}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: #2ED573; font-weight: 700;">+${Number(s.commission_amount).toFixed(2)} €</td>
    </tr>
  `).join('');

  const badgeSection = badges.length > 0 ? `
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
      <div style="font-weight: 700; margin-bottom: 10px;">🏆 Badges gagnés ce mois</div>
      <div>${badges.map((b: any) => `<span style="margin-right: 8px; font-size: 18px;">${b.badge_id}</span>`).join('')}</div>
    </div>
  ` : '';

  const challengeSection = challengeRow ? `
    <div style="background: rgba(91,110,245,0.08); border: 1px solid rgba(91,110,245,0.2); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
      <div style="font-weight: 700; margin-bottom: 4px;">🎯 Challenge complété : ${challengeRow.title}</div>
      <div style="color: #2ED573; font-weight: 700;">+${challengeRow.bonus_amount} € de bonus</div>
    </div>
  ` : '';

  const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #080810; color: #fff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, rgba(91,110,245,0.3), rgba(155,91,245,0.2)); padding: 32px 32px 24px;">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">mar<span style="color: #5B6EF5;">peap</span></div>
        <div style="margin-top: 8px; color: rgba(255,255,255,0.6); font-size: 14px;">Récapitulatif ${monthLabel}</div>
      </div>
      <div style="padding: 32px;">
        <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800;">Bilan du mois, ${referrer.full_name.split(' ')[0]} 👋</h2>
        <p style="margin: 0 0 24px; color: rgba(255,255,255,0.5); font-size: 14px;">Voici votre récapitulatif complet pour ${monthLabel}.</p>

        <div style="background: rgba(46,213,115,0.08); border: 1px solid rgba(46,213,115,0.2); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
          <div style="font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Total commissions ${monthLabel}</div>
          <div style="font-size: 36px; font-weight: 800; color: #2ED573;">+${totalCommission.toFixed(2)} €</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px;">${sales.length} vente${sales.length > 1 ? 's' : ''}</div>
        </div>

        ${badgeSection}
        ${challengeSection}

        ${sales.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <div style="font-weight: 700; margin-bottom: 12px;">📋 Détail des ventes</div>
          <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.03); border-radius: 10px; overflow: hidden;">
            <thead>
              <tr style="background: rgba(255,255,255,0.06);">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600;">Date</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600;">Client</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600;">Service</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600;">Commission</th>
              </tr>
            </thead>
            <tbody>${salesRows}</tbody>
          </table>
        </div>
        ` : '<p style="color: rgba(255,255,255,0.4); font-size: 14px;">Aucune vente ce mois-ci.</p>'}

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="https://refer.marpeap.digital/dashboard" style="display: inline-block; padding: 12px 24px; background: #5B6EF5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Voir mon tableau de bord →</a>
          <a href="https://refer.marpeap.digital/api/statement/${month}" style="display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.06); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">📄 Télécharger le relevé PDF</a>
        </div>
      </div>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Marpeap <noreply@marpeap.digital>',
        to: referrer.email,
        subject: `📊 Bilan ${monthLabel} — ${totalCommission.toFixed(2)} € de commissions`,
        html,
      }),
    });
  } catch {
    // Non-blocking
  }
}
