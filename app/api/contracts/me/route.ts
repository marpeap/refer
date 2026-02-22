import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

const STORAGE_URL = process.env.STORAGE_URL as string;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Get referrer ID from token
    const referrerId = payload.id;

    // Get active contract for this referrer
    const contracts = await sql`
      SELECT 
        id,
        pdf_filename,
        pdf_hash_before,
        status,
        otp_sent_at,
        otp_verified,
        signed_at,
        pdf_hash_after,
        created_at
      FROM contracts
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (contracts.length === 0) {
      return NextResponse.json({ contract: null });
    }

    const contract = contracts[0];

    // Log audit - contract opened
    await sql`
      INSERT INTO contract_audit (contract_id, action)
      VALUES (${contract.id}, 'opened')
    `;

    // Add full PDF URL
    contract.pdf_url = `${STORAGE_URL}/contracts/${contract.pdf_filename}`;

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
