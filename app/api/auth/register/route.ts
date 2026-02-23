import { NextRequest, NextResponse } from 'next/server';
import { hash } from '@node-rs/bcrypt';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const result = await sql`SELECT 1 as test`;
    return NextResponse.json({ ok: true, db: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
