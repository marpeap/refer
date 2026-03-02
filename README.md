# refer.marpeap.digital

Plateforme de gestion des apporteurs d'affaires Marpeap. Système de commissions automatiques, tiers, badges, challenges mensuels, MLM cascade et push notifications.

---

## Architecture

```
refer.marpeap.digital         → Dashboard apporteurs (public)
refer.marpeap.digital/admin   → Panel admin (mot de passe)
refer.marpeap.digital/login   → Authentification apporteurs
```

Base de données PostgreSQL :
```
Host : 152.114.192.211:5433
DB   : refer
User : refer
```

## Stack

- **Framework** : Next.js 14 App Router (`export const runtime = 'nodejs'` sur toutes les routes)
- **Auth apporteurs** : JWT Bearer (7 jours) via `lib/jwt.ts`
- **Auth admin** : header `x-admin-password` vs `ADMIN_PASSWORD` env
- **Emails** : Resend (`noreply@marpeap.digital`)
- **Push** : Web Push (VAPID) via `lib/push.ts`
- **Graphiques** : Recharts (AreaChart, BarChart, PieChart)
- **PDF** : pdf-lib (contrats)
- **Déploiement** : Vercel (auto-deploy sur push `main`)

---

## Structure

```
/
├── app/
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Connexion apporteur
│   ├── register/page.tsx       # Inscription apporteur
│   ├── dashboard/page.tsx      # Dashboard apporteur (7 onglets)
│   ├── admin/page.tsx          # Panel admin (8 onglets)
│   ├── r/[code]/page.tsx       # Page de parrainage dynamique
│   └── api/
│       ├── auth/{login,register}/route.ts
│       ├── me/route.ts
│       ├── sales/route.ts
│       ├── stats/route.ts
│       ├── leaderboard/route.ts
│       ├── badges/route.ts
│       ├── challenges/route.ts
│       ├── commission-rates/route.ts
│       ├── contracts/{me,sign}/route.ts
│       ├── announcements/route.ts
│       ├── push/{subscribe,unsubscribe}/route.ts
│       ├── statement/[month]/route.ts
│       ├── r/[code]/route.ts
│       ├── webhook/sale/route.ts     # ← ventes depuis app.marpeap.digital
│       └── admin/
│           ├── verify/route.ts
│           ├── referrers/{route,[id]/{route,commission-rates}}/route.ts
│           ├── sales/{route,[id]}/route.ts
│           ├── commission-rates/route.ts
│           ├── contracts/{route,send}/route.ts
│           ├── announcements/{route,[id]}/route.ts
│           ├── challenges/{route,[id]}/route.ts
│           ├── cascade/route.ts
│           ├── stats/route.ts
│           ├── payments/route.ts
│           └── send-monthly-recaps/route.ts
├── lib/
│   ├── db.ts          # Pool PostgreSQL + query() + runMigrations() (13 tables)
│   ├── jwt.ts         # signToken() / verifyToken()
│   ├── badges.ts      # BADGE_DEFINITIONS (8) + checkAndAwardBadges()
│   ├── mailer.ts      # sendMonthlyRecap(referrerId, month)
│   └── push.ts        # sendPushNotif() / sendPushToAll()
├── public/
│   ├── sw.js          # Service Worker (cache + push events)
│   └── presentations/ # Pitch deck, vidéo, fiches produit
└── package.json
```

---

## Routes API

### Apporteurs (JWT Bearer)
```
POST  /api/auth/login                # Login → JWT
POST  /api/auth/register             # Inscription
GET   /api/me                        # Profil connecté
GET   /api/sales                     # Mes ventes
GET   /api/stats                     # Stats (ventes, commissions, cascade, clics)
GET   /api/leaderboard               # Top 10 (anonymisé)
GET   /api/badges                    # Mes badges + disponibles
GET   /api/challenges                # Challenges du mois
GET   /api/commission-rates          # Taux par pack
GET   /api/contracts/me              # Mes contrats
POST  /api/contracts/sign            # Signer un contrat (OTP)
GET   /api/announcements             # Annonces actives
GET   /api/statement/[month]         # PDF relevé mensuel
POST  /api/push/subscribe            # Enregistrer push
POST  /api/push/unsubscribe          # Retirer push
GET   /api/r/[code]                  # Tracking clic + redirect
```

### Webhook (header `x-webhook-secret`)
```
POST  /api/webhook/sale              # Reçoit vente depuis app.marpeap.digital
                                     # Body: { referrer_code, client_name, service, amount }
                                     # Déclenche: commission, tier, cascade, badges, push, email
```

### Admin (header `x-admin-password`)
```
GET/POST    /api/admin/referrers
GET/PUT/DELETE /api/admin/referrers/[id]
GET/PUT     /api/admin/referrers/[id]/commission-rates
GET/POST    /api/admin/sales
PATCH/DELETE /api/admin/sales/[id]
GET/PUT     /api/admin/commission-rates
GET         /api/admin/contracts
POST        /api/admin/contracts/send
GET/POST    /api/admin/announcements
PUT/DELETE  /api/admin/announcements/[id]
GET/POST    /api/admin/challenges
PUT/DELETE  /api/admin/challenges/[id]
GET         /api/admin/cascade
GET         /api/admin/stats
GET         /api/admin/payments
POST        /api/admin/send-monthly-recaps
GET         /api/admin/verify
```

---

## Base de données

Tables créées automatiquement au boot via `runMigrations()` :

| Table | Rôle |
|-------|------|
| `referrers` | Comptes apporteurs (email, code, tier, referred_by) |
| `sales` | Ventes (commission_amount, commission_paid, paid_at) |
| `commission_rates` | Taux globaux par pack |
| `referrer_commission_rates` | Taux personnalisés par apporteur |
| `contracts` | Contrats PDF envoyés/signés |
| `link_clicks` | Tracking clics sur `/r/CODE` |
| `referrer_badges` | Badges attribués |
| `challenges` | Défis mensuels |
| `challenge_completions` | Complétions de challenges |
| `announcements` | Annonces admin |
| `push_subscriptions` | Abonnements push (VAPID) |
| `cascade_commissions` | Commissions MLM cascade |
| `cascade_rate` | Taux cascade configurable (défaut 5%) |

> **Priorité commission** : taux apporteur > taux global > 0

---

## Système de tiers (automatique)

| Tier | Condition |
|------|-----------|
| Bronze | 0–2 ventes |
| Silver | 3–9 ventes |
| Gold | 10+ ventes |

Mis à jour automatiquement à chaque vente via webhook.

---

## Badges (8)

`first_sale` · `five_sales` · `ten_sales` · `mcorp_sold` · `gold_tier` · `club_500` · `club_1000` · `recruiter`

Vérifiés et attribués automatiquement via `checkAndAwardBadges()` après chaque vente.

---

## Dashboard apporteur (7 onglets)

1. **Accueil** — Stats clés, tier, badges, lien parrainage
2. **Ventes** — Tableau ventes (commission versée/en attente)
3. **Analytics** — Graphiques (Recharts : ventes hebdo, par service, projection)
4. **Objectifs** — Challenges actifs du mois
5. **Catalogue** — 7 packs avec arguments de vente
6. **Ressources** — Vidéos, fiches PDF/PNG
7. **Classement** — Top 10 (médailles 🥇🥈🥉), propre position si hors top 10

---

## Panel admin (8 onglets)

1. **Dashboard** — KPIs globaux, graphiques
2. **Apporteurs** — Tableau, statut, tier badge, taux perso
3. **Ventes** — Tableau, marquer versé, résumé à verser/versé
4. **Commissions** — Taux globaux éditables par pack
5. **Contrats** — Envoyer PDF + OTP
6. **Annonces** — Créer/modifier annonces push
7. **Challenges** — Gérer défis mensuels
8. **Cascade** — Stats MLM (filiales, commissions cascade)

---

## Flux inter-plateformes

```
Client visite app.marpeap.digital?ref=CODE
  → Code stocké en localStorage
  → À l'achat, referrer_code inclus dans form_data

Stripe webhook (checkout.session.completed)
  → POST https://refer.marpeap.digital/api/webhook/sale
    Header: x-webhook-secret
    Body: { referrer_code, client_name, service, amount }
  → Commission créée, tier recalculé, cascade MLM, badges, push, email
```

---

## Emails (Resend)

| Trigger | Contenu |
|---------|---------|
| Activation apporteur | Code, lien parrainage, guide 4 étapes |
| Nouvelle vente | Détail vente + montant commission |
| J+2 après activation | Astuces prospection (cron 9h) |
| J+7 après activation | Bilan 1 semaine + rappel niveaux |
| Récap mensuel (admin) | Bilan commissions + badges + challenges |

---

## Variables d'environnement

```env
DATABASE_URL=postgresql://refer:xxx@152.114.192.211:5433/refer
JWT_SECRET=<secret>
ADMIN_PASSWORD=<mot-de-passe-admin>
RESEND_API_KEY=re_...
WEBHOOK_SECRET=<secret-depuis-app.marpeap.digital>
VAPID_PUBLIC_KEY=<clé-publique>
VAPID_PRIVATE_KEY=<clé-privée>
VAPID_SUBJECT=mailto:contact@marpeap.digital
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<même-que-VAPID_PUBLIC_KEY>
STORAGE_URL=https://storage.marpeap.digital
UPLOAD_SECRET=<secret>
```

---

## Cron jobs (nano-marpo)

```bash
0 9 * * * python3 /opt/marpeap/scripts/email_drip.py >> /var/log/marpeap_drip.log 2>&1
```

Script : `/opt/marpeap/scripts/email_drip.py`
Envoie les emails J+2 et J+7 aux apporteurs activés.

---

## Déploiement

Push sur `main` → déploiement automatique Vercel.

```bash
git add . && git commit -m "..." && git push origin main
```
