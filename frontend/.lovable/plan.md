## Plan: Gharpayy 10x — built only from Gharpayy.com

Single source of truth: **Gharpayy.com**. Every word, image, hero card, offer, pricing tier, area, expert reference, and CTA on this product is drawn from Gharpayy.com. No other brand or site is referenced.

---

### A. Gharpayy.com brand & tonality system

`src/lib/gharpayy-brand.ts` (new) — exported constants used everywhere:

- Headline phrases pulled from Gharpayy.com hero cards: `Move in this week. Upgrade when you're ready.`, `Direct to owner.`, `Best Rent Guaranteed.`, `Verified Zones.`, `Expert Desk 24×7.`
- Zone hero copy verbatim from Gharpayy.com:
  - Koramangala — "A 5-minute tour saves your day." · Forum Mall · Christ University · Jyoti Nivas · Party Zone | Food Street.
  - Bellandur — "Rooms change daily. Tour now." · RMZ Ecoworld · Embassy Tech · ORR · Lake View | Gym Access.
  - Mahadevapura — "Quiet places. Shown live." · RMZ Ecoworld · Sarjapur · ITPL feeder · Well Connected | Spacious.
  - Manyata Tech Park — "See it once. Lock it fast." · IBM Manyata · Elements Mall · Hebbal · Walk to Office | Meals.
  - Whitefield — "Shortlist online. Visit once." · ITPL · EPIP Zone · Phoenix · Metro Access | Power Backup.
- Gharpayy pricing tiers: Basic (₹7–11k) · Classics (₹12–17k) · Prive (₹17–26k) · Luxe Max (₹25–45k) · Homes (₹21k+). Public-facing 1 BHK headline anchor lifted to **₹25,000** (Homes tier) so the product never reads as cheap.
- Banned-word sweep: every visible `captain` / `Captain` → **Expert** / **Gharpayy Expert**; every `no broker` removed.

Design tokens in `src/styles.css` tightened: shared `--shadow-pick`, `--shadow-glow`, `--gradient-hero`, `--gradient-orange`, `--gradient-zone`, consistent radii (12 / 20 / 28).

---

### B. Five Gharpayy.com zones become the spine

Koramangala · Bellandur · Mahadevapura · Manyata Tech Park · Whitefield. Surfaced again and again:

- Public homepage `/` — Trending Zones rail directly under the hero.
- `/gharpayy` — full Five-Zone Showcase with Gharpayy hero image, expert, starts-from rent, prebook offer chip, one-tap WhatsApp.
- Area pages — Five-Zone cross-link rail at top and bottom.
- Persona quiz — final step routes to a zone + expert.
- Admin — zone chips bar, dashboard hero, map, experts, earn, payouts, channels — all zone-first.
- Earn — every playbook scoped by zone ("earn ₹X this week in Bellandur").

---

### C. Public site rebuilt to Gharpayy pitch rhythm

Common rhythm per page: **Hero → Trust strip → Trending Zones → Gharpayy Picks → Tools → Stories → Earn rail → CTA band → Footer**.

#### `/` Insights homepage
1. Hero: oversized headline, chip "Powered by real Bengaluru rents + Expert Desk", primary "Find your home", secondary "Make ₹40k/mo helping a friend".
2. Trust strip: KYC owners · 5,000+ tenants · 5 Hero Zones · 38 hubs · 4.7★ · Expert Desk 24×7.
3. Trending Zones rail (5 cards).
4. Live map preview.
5. Rent Verdict.
6. Gharpayy Picks (6 hand-picked verified homes from `insights.json`, themed in the Gharpayy Picks pattern).
7. City Heat Strip + Demand + Price Leaders.
8. Tools row (8 tools with unified pitch).
9. "10 ways to earn with Gharpayy" rail.
10. Stories strip + CTA band + Footer.

#### `/gharpayy` Landing
- Hero kept, 1 BHK anchor lifted to ₹25,000.
- Trust strip with `Expert Desk 24×7`.
- Five-Zone Showcase.
- PG vs Flat switcher (kept, restyled).
- Upgrade Ladder (PG ₹6.5k → Studio ₹16k → 1 BHK ₹25k → 2 BHK ₹32k).
- Tools mini-rail (4 most relevant).
- Earn block "Refer & Earn ₹40k/mo".
- Expert Band (renamed from CaptainBand).

#### `/area/$slug` & `/gharpayy/area/$slug`
- Hero with availability chip and Five-Zone cross-link.
- Stats: 1 BHK / 2 BHK / 3 BHK medians; 1 BHK display floor lifted to ₹25k while raw NMS data still drives charts.
- Vs Market compare (kept).
- Area-specific Gharpayy Picks.
- Tool block: Rent Verdict + Negotiation Coach scoped to area.
- Persona Match.
- Expert card with one-tap WhatsApp.

#### `/tools` and individual tool pages
Each tool wrapped in a unified frame: **Pitch header** (Why · How · What you'll get) + Tool body + **Next-best action footer** (route to Expert + zone). Tools touched: Rent Verdict, Negotiation Coach, Upgrade Path, Compare Areas, Deposit Calc, Hidden Costs, Affordability Index, Commute Matrix, Persona Quiz, Add Your Rent.

---

### D. Earn-money — a real product, not a side page

Co-equal pillar with Find-a-home. Framed as **trust** ("47 people got paid this week, here are the homes they helped book") so it never reads as a discount that scares buyers.

#### `/earn` Hub — "10 ways to earn with Gharpayy"
Each card: who it's for · 3-step how · expected ₹/month · difficulty · best zone · best persona · primary CTA.

The 10 ways:
1. Share your link on WhatsApp 1:1 — ₹500–₹2,000/booking
2. Drop a Gharpayy poster (auto A4 PDF + QR) — ₹2k/booking, passive
3. Society / apartment WhatsApp group share — ₹2k + ₹500 society bonus
4. Office / team Slack & WhatsApp share — ₹2k/booking + corporate tier
5. Refer a property owner — ₹1,000 on first booking
6. Become a Society Expert — recurring ₹3,000–₹8,000/month
7. Run a Tour Day — ₹500/tour + ₹2,000/booking
8. Instagram / Reels creator referrals — ₹2k + creator bonus
9. College / hostel ambassador — ₹500/lead + bounty
10. Corporate HR partner — bulk deals, ₹5k/employee booking

#### `/earn/:channel` Playbook (per way)
Pitch · opener script · follow-up · objection handler · voice-note · share asset (poster / story / link card) · top earner of the week · "Start earning" CTA that writes a typed event into the local store so admin Earners and Channels light up immediately.

#### `/earnings` and `/leaderboard`
Earnings Wall: live list of last 50 payouts (anonymised first names + zone + ₹). Per-user profile: channels, conversion %, ₹ earned, badges, streak.

#### `/persona-kit/:id`
Each persona: 1 opener · 1 follow-up · 1 link · 1 voice-note · 1 objection-handler — all routed to the right zone + expert.

---

### E. Admin Cockpit — 100x, connected to the multi-persona app

10 modules: **Overview · Zones · Live Map · Leads · Properties · Experts · Payouts · Earners · Channels · Activity**. Every module shows a "Why this matters · How to use it · What to do next" three-line pitch in the same rhythm as the public site.

#### Overview (`/admin/dashboard`)
- Five-Zone Command Rail (Gharpayy zone image, expert, open, conversion, SLA, next action).
- Today's cockpit: new leads, unassigned, SLA breaches, active experts.
- Money flow: revenue, payout liability, net.
- Persona × Zone matrix.
- Earner health: top 5 earners this week, ₹ paid out this month.
- Expert Workload table.
- SLA Alerts + Activity Feed.

#### Zones (`/admin/zones`, `/admin/zone/:slug`)
Hero with Gharpayy image + offer + expert + KPIs; lead pipeline; properties; mini-map; tier mix.

#### Live Map (`/admin/map`)
Full-screen-first; tile switcher (Dark / Streets / Satellite); layers (Leads, Zones, Heat, Picks); filters (zone, status, persona, tier); pin-click drawer (lead, persona, zone, tier, WhatsApp, Call, Open lead, Next-best action chip).

#### Leads (`/admin/leads`, `/admin/leads/:id`)
Saved views: Hot today · Unassigned · SLA breached · By zone · By persona. Inline status & expert change. Persona / zone / tier / channel columns. Detail page: timeline + notes + WhatsApp transcript paste.

#### Properties (`/admin/properties`)
Grouped by zone, tier badges, occupancy ring, owner pipeline.

#### Experts (`/admin/captains` route, "Experts" UI)
Workload, SLA, win rate by persona, payouts owed, complaints.

#### Payouts (`/admin/payouts`)
Pending / Approved / Paid; per-expert + per-referrer breakdown; UPI export CSV; monthly statement.

#### Earners (`/admin/earners`)
Leaderboard; per-user profile; promote to Society Expert with one click.

#### Channels (`/admin/channels`)
Cost per lead, conversion, ₹/closed booking by channel.

#### Activity
Event-sourced stream filtered by zone / expert / channel / persona.

---

### F. Public ↔ Admin wiring (one product feel)

Every public CTA writes typed events with `zoneId, tier, channel, referrerCode, personaId` through the existing `src/referral-app/api/index.ts`. Persona quiz routes to the matching expert and zone; the lead surfaces in admin Leads with persona + zone + tier columns. Earn pages also write events so Earners and Channels light up immediately.

---

### G. Median 1 BHK anchor

Public-facing 1 BHK "starts at" / "median" labels lifted to **₹25,000** in `src/routes/gharpayy.tsx`, `gharpayy.area.$slug.tsx`, `area.$slug.tsx`, Upgrade Ladder, Pricing Tiers display, and Insights tools. Raw NMS counts in `insights.json` keep driving the histograms and demand charts; only the headline anchor changes.

---

### H. Technical approach

Frontend / presentation only. No backend or schema changes.

**New files**
- `src/lib/gharpayy-brand.ts` — phrases, chips, taglines, banned-word sweep helper.
- `src/components/ZoneSpine.tsx`, `GharpayyPicks.tsx`, `EarnWaysRail.tsx`, `ToolPitch.tsx`, `ExpertCard.tsx`.
- `src/referral-app/components/admin/ZoneCommandRail.tsx`, `PersonaZoneMatrix.tsx`, `EarnerHealth.tsx`, `ExpertWorkload.tsx`, `NextBestAction.tsx`.

**Modified — public**
`src/routes/index.tsx`, `gharpayy.tsx`, `gharpayy.area.$slug.tsx`, `area.$slug.tsx`, `tools.tsx`, `persona-quiz.tsx`, `compare.tsx`, `rent-verdict.tsx`, `seekers.tsx`, plus `src/components/insights/*` (pitch header / footer wrap).

**Modified — brand sweep (visible strings only)**
`src/lib/captains.ts`, `wa.ts`, `personas.ts`, `earn-rules.ts`, `gharpayy-zones.ts`, `referral.ts`, `area-context.ts`, `src/components/Header.tsx`, `Footer.tsx`, `MobileBottomBar.tsx`, `CaptainCard.tsx`, `GharpayyTeam.tsx`, `SearchHero.tsx`, `Personas.tsx`. Every visible "captain" → "Expert" / "Gharpayy Expert"; every "no broker" removed.

**Modified — admin**
`admin-layout.tsx`, `pages/admin/dashboard.tsx`, `map.tsx`, `captains.tsx` (re-skinned as Experts), `zones.tsx`, `zone-detail.tsx`, `leads.tsx`, `lead-detail.tsx`, `properties.tsx`, `payouts.tsx`, `earners.tsx`, `channels.tsx`, components in `src/referral-app/components/admin/*`.

**Modified — earn**
`pages/earn-hub.tsx`, `earn-playbook.tsx`, `persona-kit.tsx`, `earnings.tsx`, `leaderboard.tsx`, `chain.tsx`, `streak.tsx`.

**Out of scope**
Real auth/roles, live websockets, payment integration, replacing wouter with TanStack in admin.

---

### I. Validation after build

- Repo sweep: zero user-visible `captain` strings; zero `no broker` strings.
- Public homepage and Gharpayy landing surface the five zones at least three times each.
- Every tool/calculator has the unified pitch header + Expert+Zone CTA footer.
- `/earn` shows 10 distinct ways with expected ₹, difficulty, best zone, scripts, share asset.
- Admin dashboard, map, zones, experts, earners, channels each show the three-line pitch block and connect to real NMS lead data.
- 1 BHK headline anchor reads ₹25,000 in all public starts-at and median-callouts; raw chart data unchanged.
- Mobile (current 747px viewport) passes: zone rail, picks, tools, earn rail, admin map all readable and tappable.