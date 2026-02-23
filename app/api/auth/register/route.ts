import { NextRequest, NextResponse } from 'next/server';
import { hash } from '@node-rs/bcrypt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const testHash = await hash('test', 10);
  return NextResponse.json({ ok: true, hash: testHash }, { status: 200 });
}
