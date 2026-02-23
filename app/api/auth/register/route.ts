import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const hash = await bcrypt.hash('test', 10);
  return NextResponse.json({ ok: true, hash }, { status: 200 });
}
