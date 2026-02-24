# refer.marpeap.digital

Plateforme de gestion des apporteurs d'affaires Marpeap.
Next.js 14 (App Router) — déployé sur **Vercel** via GitHub (`marpeap/refer`).

---

## Architecture

```
refer.marpeap.digital         → Dashboard apporteurs (public)
refer.marpeap.digital/admin   → Panel admin (mot de passe)
refer.marpeap.digital/login   → Authentification apporteurs
```

Base de données PostgreSQL séparée :
```
Host     : 152.114.192.211:5433
DB       : refer
User     : refer
```

---

## Variables d'environnement (.env.local)

| Variable | Usage |
|----------|-------|
| `DATABASE_URL` | Connexion PostgreSQL refer |
| `JWT_SECRET` | Signature tokens apporteurs |
| `ADMIN_PASSWORD` | Accès panel admin |
| `RESEND_API_KEY` | Emails transactionnels (Resend) |
| `WEBHOOK_SECRET` | Auth webhook entrant depuis app.marpeap.digital |

---

## Schéma DB

### `referrers`
| Colonne | Type | Notes |
|---------|------|-------|
| id | UUID | PK |
| full_name | VARCHAR | |
| email | VARCHAR | unique |
| phone | VARCHAR | |
| code | VARCHAR | unique, ex: DUPONT-7K3M |
| status | VARCHAR | pending / active / suspended |
| tier | VARCHAR | bronze / silver / gold |
| activated_at | TIMESTAMPTZ | renseigné à l'activation (J+0 pour drip) |
| created_at | TIMESTAMPTZ | |

### `sales`
| Colonne | Type | Notes |
|---------|------|-------|
| id | UUID | PK |
| referrer_id | UUID | FK referrers |
| client_name | VARCHAR | |
| service | VARCHAR | ex: M-ONE, M-CALLING... |
| amount | NUMERIC | montant TTC |
| commission_amount | NUMERIC | calculé auto ou saisi |
| commission_paid | BOOLEAN | default false |
| paid_at | TIMESTAMPTZ | null si non versé |
| admin_note | TEXT | |
| created_at | TIMESTAMPTZ | |

### `commission_rates` (taux globaux par défaut)
| Colonne | Type | Notes |
|---------|------|-------|
| pack_name | VARCHAR | PK: M-ONE, M-SHOP LITE... |
| commission_amount | NUMERIC | taux par défaut pour tous |
| updated_at | TIMESTAMPTZ | |

### `referrer_commission_rates` (taux personnalisés par apporteur)
| Colonne | Type | Notes |
|---------|------|-------|
| referrer_id | UUID | PK composite |
| pack_name | VARCHAR | PK composite |
| commission_amount | NUMERIC | override du taux global |
| updated_at | TIMESTAMPTZ | |

> **Priorité commission** : taux apporteur > taux global > 0

### `contracts`
Contrats PDF envoyés aux apporteurs via OTP.

---

## Routes API

### Apporteurs (auth JWT)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Login apporteur |
| GET | `/api/referrer/me` | Profil + stats |
| GET | `/api/sales` | Ventes de l'apporteur connecté |
| GET | `/api/leaderboard` | Top 10 classement (noms anonymisés) |

### Webhook (auth WEBHOOK_SECRET)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/webhook/sale` | Reçoit une vente depuis app.marpeap.digital |

### Admin (auth x-admin-password header)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/admin/referrers` | Liste / créer apporteurs |
| PUT | `/api/admin/referrers/[id]` | Modifier statut (active/suspended) |
| GET/PUT/DELETE | `/api/admin/referrers/[id]/commission-rates` | Taux personnalisés |
| GET/POST | `/api/admin/sales` | Liste / créer ventes |
| PATCH/DELETE | `/api/admin/sales/[id]` | Marquer commission versée / supprimer |
| GET/PUT | `/api/admin/commission-rates` | Taux globaux par défaut |
| GET | `/api/admin/contracts` | Liste contrats |
| POST | `/api/admin/contracts/send` | Envoyer contrat PDF à signer |

---

## Fonctionnalités implémentées

### Dashboard apporteur
- **Ventes** : tableau avec commission_amount, badge "Versée ✓" / "En attente", stat "En attente" visible
- **Catalogue** : 7 packs avec prix, arguments de vente, pitch
- **Ressources** : vidéo présentation, fiche M-CALLING PDF/PNG
- **Classement** : top 10, médailles 🥇🥈🥉, noms anonymisés, propre position si hors top 10

### Système de niveaux (tiers)
- Bronze : 0–2 ventes
- Silver : 3–9 ventes
- Gold : 10+ ventes
- Mis à jour automatiquement à chaque vente

### Emails (via Resend, from: noreply@marpeap.digital)
| Trigger | Contenu |
|---------|---------|
| Activation par admin | Code, lien parrainage, guide 4 étapes |
| Nouvelle vente enregistrée | Détail vente + montant commission |
| J+2 après activation | Astuces prospection (cron 9h) |
| J+7 après activation | Bilan 1 semaine + rappel niveaux |

### Admin panel
- Tableau apporteurs : statut, tier badge, bouton "Commissions" (modal taux perso)
- Tableau ventes : commission_amount, bouton "Marquer versé", résumé à verser/versé
- Onglet Commissions : taux globaux éditables
- Export CSV des ventes (UTF-8 BOM, compatible Excel)

---

## Flux inter-plateformes

```
Client visite app.marpeap.digital?ref=CODE
  → ref stocké en localStorage
  → À l'achat, referrer_code inclus dans form_data

Stripe confirme paiement
  → app.marpeap.digital webhook reçoit checkout.session.completed
  → POST /api/webhook/sale sur refer.marpeap.digital
    Body: { referrer_code, client_name, service, amount }
    Header: x-webhook-secret: WEBHOOK_SECRET
```

---

## Cron jobs (nano-marpo)

```
0 9 * * * python3 /opt/marpeap/scripts/email_drip.py >> /var/log/marpeap_drip.log 2>&1
```

Script : `/opt/marpeap/scripts/email_drip.py`
Envoie les emails J+2 et J+7 aux apporteurs activés.

---

## Déploiement

- **Vercel** : déploiement automatique sur push `main` → GitHub `marpeap/refer`
- Pas de build step particulier, Next.js standard

---

## Idées / backlog

- [ ] Réinitialisation mot de passe apporteurs
- [ ] Page de profil éditable (téléphone, email)
- [ ] Notifications in-app (badge) sur nouvelles ventes
- [ ] Email J+30 pour les apporteurs sans vente
