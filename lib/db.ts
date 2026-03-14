import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

export { pool };

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
  let client;
  try {
    client = await pool.connect();
    // ── 0a. Core table: referrers ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrers (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name     VARCHAR NOT NULL,
        email         VARCHAR NOT NULL UNIQUE,
        phone         VARCHAR,
        password_hash VARCHAR NOT NULL,
        code          VARCHAR NOT NULL UNIQUE,
        status        VARCHAR DEFAULT 'pending',
        tier          VARCHAR DEFAULT 'bronze',
        referred_by   UUID REFERENCES referrers(id),
        activated_at  TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── 0b. Core table: sales ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id         UUID REFERENCES referrers(id),
        client_name         VARCHAR NOT NULL,
        service             VARCHAR NOT NULL,
        amount              NUMERIC NOT NULL,
        commission_amount   NUMERIC DEFAULT 0,
        status              VARCHAR DEFAULT 'confirmed',
        source              VARCHAR DEFAULT 'webhook',
        checkout_session_id VARCHAR,
        client_email        VARCHAR,
        client_phone        VARCHAR,
        admin_note          TEXT,
        commission_paid     BOOLEAN DEFAULT FALSE,
        paid_at             TIMESTAMPTZ,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── 0c. Core table: commission_rates ───────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS commission_rates (
        pack_name         VARCHAR PRIMARY KEY,
        commission_amount NUMERIC NOT NULL,
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);

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

    // Colonnes potentiellement absentes si les tables core ont été créées manuellement
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE referrers ADD COLUMN IF NOT EXISTS tier VARCHAR DEFAULT 'bronze'`);

    // 10. Flux "Créer une Vente" — colonnes sales
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'confirmed'`);
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_checkout_session_id ON sales(checkout_session_id)`);
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'webhook'`);
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_email VARCHAR`);
    await client.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_phone VARCHAR`);

    // 11. Registre de consentement RGPD
    await client.query(`
      CREATE TABLE IF NOT EXISTS consent_registry (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id   UUID REFERENCES referrers(id) ON DELETE CASCADE,
        client_email  VARCHAR NOT NULL,
        consent_type  VARCHAR NOT NULL,
        given_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 12. Contrainte unicité cascade_commissions (idempotence webhook replay)
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_cascade_commissions_sale_referrer ON cascade_commissions(sale_id, referrer_id)`);

    // 13. Consent registry unique constraint (dedup on retry)
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_registry_referrer_email_type ON consent_registry(referrer_id, client_email, consent_type)`);

    // 14. Performance indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_referrer_id ON sales(referrer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_client_email ON sales(client_email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_referrer_status ON sales(referrer_id, status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cascade_commissions_referrer_id ON cascade_commissions(referrer_id)`);

    console.log('[DB] Migrations completed');
  } catch (err) {
    console.error('[DB] Migration error:', err);
  } finally {
    client?.release();
  }
}
