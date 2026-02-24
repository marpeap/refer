import { query } from '@/lib/db';

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

function verifyAdminPassword(req: NextRequest): boolean {
  const adminPassword = req.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

async function sendActivationEmail(email: string, fullName: string, code: string) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Marpeap <noreply@marpeap.digital>',
        to: email,
        subject: `Bienvenue dans le programme Marpeap Apporteurs 🚀`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #080810; color: #fff; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, rgba(91,110,245,0.3), rgba(155,91,245,0.2)); padding: 32px 32px 24px;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">mar<span style="color: #5B6EF5;">peap</span></div>
            </div>
            <div style="padding: 32px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800;">Votre compte est activé ! 🎉</h2>
              <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 28px;">Bonjour ${fullName}, bienvenue dans le programme apporteur d'affaires Marpeap.</p>

              <div style="background: rgba(91,110,245,0.08); border: 1px solid rgba(91,110,245,0.2); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Votre code personnel</div>
                <div style="font-size: 26px; font-weight: 800; color: #5B6EF5; letter-spacing: 2px;">${code}</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 12px;">Votre lien de parrainage :</div>
                <div style="font-size: 13px; color: #5B6EF5; margin-top: 4px; word-break: break-all;">https://app.marpeap.digital?ref=${code}</div>
              </div>

              <div style="margin-bottom: 28px;">
                <div style="font-weight: 700; margin-bottom: 14px; font-size: 15px;">Comment ça marche :</div>
                ${['Partagez votre lien à des prospects (TPE, PME, indépendants...)', 'Ils s\'inscrivent sur app.marpeap.digital et choisissent un pack', 'Après leur paiement, une commission est automatiquement enregistrée', 'Nous vous versons la commission par virement bancaire'].map((step, i) => `
                <div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start;">
                  <div style="min-width: 24px; height: 24px; background: rgba(91,110,245,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #5B6EF5;">${i + 1}</div>
                  <div style="font-size: 14px; color: rgba(255,255,255,0.6); padding-top: 2px;">${step}</div>
                </div>`).join('')}
              </div>

              <a href="https://refer.marpeap.digital/dashboard" style="display: inline-block; padding: 12px 28px; background: #5B6EF5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Accéder à mon dashboard →</a>

              <p style="color: rgba(255,255,255,0.25); font-size: 12px; margin-top: 28px;">Dans votre tableau de bord, retrouvez le catalogue complet des produits avec vos arguments de vente, vos ressources et le suivi de vos commissions.</p>
            </div>
          </div>
        `,
      }),
    });
  } catch {
    // Email failure is non-blocking
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminPassword(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { status } = await req.json();

    if (!['pending', 'active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const referrers = await query('SELECT full_name, email, code, status as prev_status FROM referrers WHERE id = $1', [params.id]);
    if (referrers.length === 0) {
      return NextResponse.json({ error: 'Apporteur introuvable' }, { status: 404 });
    }

    await query('UPDATE referrers SET status = $1 WHERE id = $2', [status, params.id]);

    // Send activation email when newly activated
    if (status === 'active' && referrers[0].prev_status !== 'active') {
      const { full_name, email, code } = referrers[0];
      sendActivationEmail(email, full_name, code);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
