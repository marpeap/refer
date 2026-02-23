import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contracts = await query(`
      SELECT 
        c.id,
        c.pdf_filename,
        c.pdf_hash_before,
        c.status,
        c.otp_sent_at,
        c.otp_verified,
        c.signed_at,
        c.pdf_hash_after,
        c.created_at,
        r.full_name,
        r.email,
        r.code
      FROM contracts c
      JOIN referrers r ON c.referrer_id = r.id
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Get contracts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
