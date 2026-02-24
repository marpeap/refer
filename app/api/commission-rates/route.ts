import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rates = await query(
      'SELECT pack_name, commission_amount FROM commission_rates ORDER BY pack_name'
    );
    return NextResponse.json(rates);
  } catch {
    return NextResponse.json([]);
  }
}
