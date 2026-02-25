import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  const client = await pool.connect();
  try {
    // 1. Tracking clics sur /r/CODE
    await client.query(`
      CREATE TABLE IF NOT EXISTS link_clicks (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES referrers(id) ON DELETE CASCADE,
        ip_address  VARCHAR,
        user_agent  TEXT,
        referer     TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 2. Badges obtenus par apporteur
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrer_badges (
        referrer_id UUID REFERENCES referrers(id) ON DELETE CASCADE,
        badge_id    VARCHAR NOT NULL,
        earned_at   TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (referrer_id, badge_id)
      )
    `);

    // 3. Challenges mensuels
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title           VARCHAR NOT NULL,
        description     TEXT,
        month           VARCHAR NOT NULL,
        condition_type  VARCHAR NOT NULL,
        condition_value JSONB NOT NULL,
        bonus_amount    NUMERIC NOT NULL,
        active          BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 4. Completions de challenges
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenge_completions (
        referrer_id  UUID REFERENCES referrers(id) ON DELETE CASCADE,
        challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        bonus_paid   BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (referrer_id, challenge_id)
      )
    `);

    // 5. Annonces admin → apporteurs
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title      VARCHAR NOT NULL,
        content    TEXT NOT NULL,
        type       VARCHAR DEFAULT 'info',
        active     BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      )
    `);

    // 6. Push notification subscriptions
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES referrers(id) ON DELETE CASCADE,
        endpoint    TEXT NOT NULL UNIQUE,
        p256dh      TEXT NOT NULL,
        auth_key    TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 7. Cascade MLM — colonne referred_by sur referrers
    await client.query(`
      ALTER TABLE referrers ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES referrers(id)
    `);

    // 8. Commissions cascade
    await client.query(`
      CREATE TABLE IF NOT EXISTS cascade_commissions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id     UUID REFERENCES sales(id) ON DELETE CASCADE,
        referrer_id UUID REFERENCES referrers(id),
        filleul_id  UUID REFERENCES referrers(id),
        amount      NUMERIC NOT NULL,
        paid        BOOLEAN DEFAULT FALSE,
        paid_at     TIMESTAMPTZ,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 9. Taux cascade configurable
    await client.query(`
      CREATE TABLE IF NOT EXISTS cascade_rate (
        id         INTEGER PRIMARY KEY DEFAULT 1,
        rate       NUMERIC NOT NULL DEFAULT 5,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      INSERT INTO cascade_rate (id, rate) VALUES (1, 5) ON CONFLICT DO NOTHING
    `);

    console.log('[DB] Migrations completed');
  } catch (err) {
    console.error('[DB] Migration error:', err);
  } finally {
    client.release();
  }
}
