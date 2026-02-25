import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const referrers = await query(
    "SELECT id FROM referrers WHERE code = $1 AND status = 'active'",
    [code]
  );

  if (referrers.length === 0) {
    return NextResponse.redirect(new URL('https://refer.marpeap.digital'));
  }

  const referrerId = referrers[0].id;

  // Log click (non-blocking)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const userAgent = req.headers.get('user-agent') || null;
  const referer = req.headers.get('referer') || null;

  query(
    `INSERT INTO link_clicks (referrer_id, ip_address, user_agent, referer) VALUES ($1, $2, $3, $4)`,
    [referrerId, ip, userAgent, referer]
  ).catch(() => {});

  return NextResponse.redirect(`https://app.marpeap.digital?ref=${code}`, 302);
}
