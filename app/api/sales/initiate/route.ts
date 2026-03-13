import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import crypto from 'crypto';

export const runtime = 'nodejs';

const EXCLUDED_PACKS_V1 = ['M-LOCAL', 'M-SHOP LITE', 'M-CALLING'];

function hmacSign(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    const payload = verifyToken(authHeader.substring(7));
    const referrerId = payload.id;

    // Guard: referrer must be active
    const [referrer] = await query(
      "SELECT id, code, status, email FROM referrers WHERE id = $1",
      [referrerId]
    );
    if (!referrer || referrer.status !== 'active') {
      return NextResponse.json({ error: 'Compte non actif' }, { status: 403 });
    }

    const { client_email, client_name, client_phone, company_name, service } = await req.json();

    if (!client_email || !client_name || !service) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    // Validate pack (M-CAMPAIGN excluded v1)
    if (EXCLUDED_PACKS_V1.includes(service)) {
      return NextResponse.json({ error: 'Ce pack n\'est pas disponible pour le moment' }, { status: 400 });
    }

    // Anti-auto-referral
    if (client_email.toLowerCase() === referrer.email.toLowerCase()) {
      return NextResponse.json({ error: 'Auto-parrainage interdit' }, { status: 400 });
    }

    // Anti-double-click: check for existing initiated sale in last 24h
    const existingSales = await query(
      `SELECT id, checkout_session_id FROM sales
       WHERE referrer_id = $1 AND client_email = $2 AND service = $3
         AND status = 'initiated' AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC LIMIT 1`,
      [referrerId, client_email.toLowerCase(), service]
    );

    let saleId: string;

    if (existingSales.length > 0 && existingSales[0].checkout_session_id) {
      // Already has a checkout session — return existing (idempotent)
      // We don't have the URL cached, so we re-call the app
      saleId = existingSales[0].id;
    } else if (existingSales.length > 0 && !existingSales[0].checkout_session_id) {
      // Reuse existing sale (retry)
      saleId = existingSales[0].id;
    } else {
      // Create new initiated sale
      const [newSale] = await query(
        `INSERT INTO sales (id, referrer_id, client_name, service, amount, commission_amount, status, source, client_email, client_phone, admin_note, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 0, 0, 'initiated', 'referrer', $4, $5, $6, NOW())
         RETURNING id`,
        [referrerId, client_name, service, client_email.toLowerCase(), client_phone || null, `Vente initiee par ${referrer.code}`]
      );
      saleId = newSale.id;

      // RGPD consent registry
      await query(
        `INSERT INTO consent_registry (referrer_id, client_email, consent_type)
         VALUES ($1, $2, 'referral_checkout')`,
        [referrerId, client_email.toLowerCase()]
      );
    }

    // Call app to create Stripe Checkout session
    const appUrl = process.env.APP_API_URL || 'https://api.marpeap.digital';
    const hmacSecret = process.env.REFER_HMAC_SECRET || '';

    const bodyPayload = JSON.stringify({
      sale_id: saleId,
      referrer_code: referrer.code,
      client_email: client_email.toLowerCase(),
      client_name,
      client_phone: client_phone || null,
      company_name: company_name || null,
      pack_id: service,
    });

    const signature = hmacSign(bodyPayload, hmacSecret);

    const appResponse = await fetch(`${appUrl}/referral/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Refer-Signature': signature,
      },
      body: bodyPayload,
    });

    if (!appResponse.ok) {
      const errBody = await appResponse.text();
      console.error('[sales/initiate] App error:', appResponse.status, errBody);

      // If sale was just created, mark as failed
      if (!existingSales.length) {
        await query("UPDATE sales SET status = 'failed' WHERE id = $1", [saleId]);
      }

      // Forward specific known errors from the app
      let userMessage = 'Erreur lors de la création de la session de paiement';
      try {
        const parsed = JSON.parse(errBody);
        if (appResponse.status === 403) userMessage = parsed.detail || 'Accès refusé pour cet email';
        else if (appResponse.status === 400) userMessage = parsed.detail || 'Données invalides';
      } catch {}
      return NextResponse.json({ error: userMessage }, { status: appResponse.status >= 500 ? 502 : appResponse.status });
    }

    const { checkout_url, session_id } = await appResponse.json();

    // Update sale with checkout_session_id
    await query(
      'UPDATE sales SET checkout_session_id = $1 WHERE id = $2',
      [session_id, saleId]
    );

    return NextResponse.json({ checkout_url, sale_id: saleId });
  } catch (error: any) {
    console.error('[sales/initiate] Error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
