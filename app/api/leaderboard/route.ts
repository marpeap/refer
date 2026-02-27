import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const payload = verifyToken(authHeader.substring(7));
    const myId = payload.id;

    // Top 10 par montant de commissions totales
    const top = await query(`
      SELECT
        r.id,
        r.full_name,
        r.tier,
        COUNT(s.id)::int            AS sales_count,
        COALESCE(SUM(s.commission_amount), 0) AS total_commission
      FROM referrers r
      LEFT JOIN sales s ON s.referrer_id = r.id
      WHERE r.status = 'active'
      GROUP BY r.id, r.full_name, r.tier
      ORDER BY total_commission DESC, sales_count DESC
      LIMIT 10
    `);

    // Position de l'utilisateur connecté (si hors top 10)
    const myRankRow = await query(`
      SELECT rank, total_commission, sales_count FROM (
        SELECT
          r.id,
          RANK() OVER (ORDER BY COALESCE(SUM(s.commission_amount), 0) DESC, COUNT(s.id) DESC) AS rank,
          COALESCE(SUM(s.commission_amount), 0) AS total_commission,
          COUNT(s.id)::int AS sales_count
        FROM referrers r
        LEFT JOIN sales s ON s.referrer_id = r.id
        WHERE r.status = 'active'
        GROUP BY r.id
      ) sub
      WHERE id = $1
    `, [myId]);

    const myRank = myRankRow[0] ?? null;

    // Anonymise les noms sauf le sien (prénom + initiale nom)
    const board = top.map((r, i) => ({
      rank: i + 1,
      name: r.id === myId ? r.full_name : anonymize(r.full_name),
      tier: r.tier,
      sales_count: r.sales_count,
      total_commission: Number(r.total_commission),
      is_me: r.id === myId,
    }));

    return NextResponse.json({
      board,
      my_rank: myRank ? { rank: Number(myRank.rank), total_commission: Number(myRank.total_commission), sales_count: myRank.sales_count } : null,
    });
  } catch {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }
}

function anonymize(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '***';
  if (parts.length === 1) return (parts[0][0] ?? '') + '***';
  return parts[0] + ' ' + (parts[parts.length - 1][0] ?? '') + '.';
}
