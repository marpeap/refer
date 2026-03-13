import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Accept admin password or CRON_SECRET
  const adminPassword = req.headers.get('x-admin-password');
  const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  const isAdmin = adminPassword === process.env.ADMIN_PASSWORD;
  const isCron = cronSecret === process.env.CRON_SECRET;

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all initiated sales older than 24h
    const expiredSales = await query(
      `UPDATE sales SET status = 'expired'
       WHERE status = 'initiated' AND created_at < NOW() - INTERVAL '24 hours'
       RETURNING id, checkout_session_id`
    );

    // For each sale with a checkout_session_id, try to expire the Stripe session via app
    const appUrl = process.env.APP_API_URL || 'https://api.marpeap.digital';
    const webhookSecret = process.env.WEBHOOK_SECRET || '';
    let expiredSessions = 0;

    for (const sale of expiredSales) {
      if (sale.checkout_session_id) {
        try {
          await fetch(`${appUrl}/referral/expire-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': webhookSecret,
            },
            body: JSON.stringify({ session_id: sale.checkout_session_id }),
          });
          expiredSessions++;
        } catch {
          // Non-blocking: Stripe session may already be expired
        }
      }
    }

    return NextResponse.json({
      ok: true,
      expired_count: expiredSales.length,
      expired_sessions: expiredSessions,
    });
  } catch (error) {
    console.error('[admin/sales/expire] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
