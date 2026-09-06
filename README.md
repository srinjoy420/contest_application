# Contest Ranking Engine

This is my submission for the contest ranking engine assignment. It's split into two
independent services (User Service and Admin Service) plus a React frontend. Below I've
explained how the data is modeled, how the two services talk to each other, and the
assumptions and decisions I made along the way, including a round of changes I made
after an initial review.

## Why two services

User Service owns everything about users, posts, likes, comments and views. It's on
MongoDB because that data is document-ish and grows fast (posts, likes, comments).

Admin Service owns winners and KYC status. It's on Postgres + Prisma because that data
is relational and needs to be reliable — a winner should never accidentally exist twice,
and I wanted the DB itself to help enforce that.

The important rule I stuck to: Admin Service never touches User Service's database
directly. It only talks to it over HTTP, through a small set of internal routes.

## Architecture within each service

Both services follow the same layering, top to bottom:

```
routes        -> just defines the URL + method, wires up middleware, calls a controller
controllers   -> pulls data out of the request, calls a service, sends the response
services      -> the actual business logic (cascade rules, KYC processing, scoring)
repositories  -> the only layer allowed to talk to the database directly
```

I did this so each layer can change independently — e.g. swapping how a query is
written only touches the repository, not the business logic sitting on top of it, and
controllers stay thin enough that there's nowhere for stray logic to hide.

## Data model

**User Service (Mongo)**
- `User` — email, hashed password, username, `residency` (only `"Chhattisgarh"`
  residents are contest-eligible), and a `role` field (`user` / `admin`) used for
  access control on the admin side.
- `Post` — creator, caption, category (one of 10 fixed categories), media info, and a
  `counts` object (likes/comments/views). `score` is stored directly on the post and
  kept up to date with atomic `$inc` operations on every like/comment/view, instead of
  being recalculated from scratch on read.
- `Like` — its own collection, not a counter, with a unique index on `(post, user)`.
  This is what stops someone double-liking a post under concurrent requests — the DB
  rejects the second insert outright, so there's no race window in application code.
- `Comment` — its own collection too, since comments are real content people read back.
- `Ranking` — a stored snapshot of the last computed Global/Category/Consistency
  rankings (explained more below, under Background Processing).

**Admin Service (Postgres/Prisma)**
- `Winner` — one row per person who is or was holding a prize. Has a `tier`, a
  `status` (`ACTIVE` / `CASCADED`), and a `userId` that refers back to a Mongo user —
  a plain string, not a real foreign key, since Postgres can't validate a reference
  into a different database. Noted as a known limitation rather than pretending it's
  enforced.
- `KycRequest` — one per winner, tracks pending/passed/failed.
- `CASCADED` winners are kept, not deleted, so there's a full audit trail. Each
  replacement winner points back to who they replaced via `cascadedFromId`, so a chain
  of KYC failures can be traced end to end.

## Config management

Every environment variable is read through a single `config/config.js` in each
service, instead of scattering `process.env.X` across files. It validates that all
required variables are present at startup and throws immediately with a clear message
if one's missing, rather than failing confusingly later inside some unrelated route.
Everything else in the codebase imports from this file, never from `process.env`
directly.

## Validation

Request validation goes through Zod schemas (`schemas/`) applied as a small
`validate(schema)` middleware, instead of manual `if` checks scattered through route
handlers. This gives consistent error responses across every route and validates the
whole request body in one place rather than field by field.

## Shared auth across both services

User Service and Admin Service both have their own `middleware/auth.js`, and both
files are functionally identical: they use the same `JWT_SECRET` and the same
`requireAuth` logic to verify a token, so a token means exactly the same thing no
matter which service checks it. Admins aren't a separate login system — they're just
`User` documents with `role: "admin"`, and they log in through User Service's normal
login route like anyone else.

On top of verifying *who* someone is, a `requireRole("admin")` middleware handles
*what they're allowed to do* — Admin Service's winners/KYC routes are protected by
both `requireAuth` and `requireRole("admin")`, so a regular user's valid token still
gets rejected there.

Since the two services are separate codebases rather than a monorepo, "shared" here
means the same file exists in both places rather than being imported from one shared
package. For a project this size that felt like the right trade-off — a real
production setup would likely publish this as an internal package instead.

## How the two services talk (API contract)

User Service exposes internal-only endpoints that Admin Service calls:

```
GET /internal/rankings/global        -> best post per creator, sorted
GET /internal/rankings/category      -> best post per creator per category, all 10 categories
GET /internal/rankings/consistency   -> creators who qualify + their consistency score
```

These are protected by a shared secret header (`x-internal-secret`), known to both
services via their `.env` files. It's not a production-grade solution — a real system
would likely use mTLS or a private network — but it's enough to stop a random
JWT-holding user from hitting these routes directly and pulling raw ranking data.

Admin Service's user-facing routes (used by the frontend, protected by `requireAuth` +
`requireRole("admin")`):
```
GET  /admin/winners?tier=...          -> list current winners, optionally filtered by tier
POST /admin/winners/:id/kyc           -> body: { passed: true/false }, triggers cascade on failure
```

## The ranking logic

Score per post is `likes*1 + comments*3 + views*0.2`. Ties break by comments, then
views, then whichever post was created first — this comparison lives in a single
`comparePosts()` helper used everywhere, rather than being repeated in three places.

**Global** — for every eligible creator, take their single best post, rank those.

**Category** — same idea, done separately per category (10 independent rankings).

**Consistency** — only creators who posted 3+ times in every one of the 4 contest
weeks qualify at all. If they qualify, their score is the sum of their top 3 posts'
scores in each week, summed across all 4 weeks. Weeks are relative to a fixed
`CONTEST_START_DATE` constant rather than calendar weeks.

One assumption worth flagging honestly: the spec defines the tie-break rule at the
post level, but doesn't say how to break a tie between two creators' consistency
scores. I extended the same rule down to each creator's best qualifying post as a
reasonable default — not something explicitly asked for.

## Background processing

Rankings used to be computed live, inside the request, every time someone asked for
them — meaning the same expensive computation could run repeatedly for no reason, and
the caller had to wait on it. That's now moved out of the request path entirely:

- A scheduled job (`node-cron`, every 5 minutes, plus once on startup) recomputes
  Global/Category/Consistency rankings and writes the result into a `Ranking`
  collection in Mongo.
- `GET /internal/rankings/*` now just reads that stored snapshot — no aggregation
  happens on request anymore, so it's a fast, cheap read regardless of how much
  underlying post data exists.
- Admin Service didn't need any changes for this — it was already calling those same
  URLs, so from its side, responses just got faster.

The 5-minute interval is a reasonable default, not a hard requirement — in a real
deployment this would more likely also trigger on specific events (e.g. after enough
new likes/comments land) rather than purely on a timer.

## The prize cascade

Processed strictly in this order:

1. Grand Prize (1)
2. Consistency 1st (1)
3. Consistency 2nd (1)
4. Top Performers (10 distinct people, from the Global ranking)
5. Category 1st (10, one per category)
6. Category 2nd (10, one per category, no backfill if a category runs out of people)

Everyone can only win once, total — once someone's been given a prize at a higher
tier, they're skipped everywhere else.

The trickiest part is category collapse: if the same person is #1 in more than one
category, they keep only the category where their post scored highest, and the other
category's slot goes to whoever's next in line for that category. This resolves in a
loop rather than a single pass, since a person promoted into a freed-up slot could
themselves collide with yet another category — it keeps resolving until nothing's
colliding. "Highest score" was my choice for the tie-break on which category someone
keeps, since the spec didn't specify this either.

If a category genuinely runs out of eligible people, that category's 2nd place is
left unawarded — no backfill to 3rd, per the spec.

## KYC and cascading on failure

When a winner's KYC is marked failed, they're marked `CASCADED` (not deleted, for the
audit trail), and the system looks for the next eligible person for that same
tier/category. If that replacement also fails KYC later, the exact same function runs
again on them — it's not a separate "second failure" code path, so it naturally
chains as many times as needed.

## Cross-service communication — a deliberate decision

I considered introducing a message broker (NATS/Kafka) so services wouldn't need to
call each other directly over HTTP, and worked through what that would actually look
like here before deciding where it does and doesn't fit.

The core interaction between the two services — Admin Service asking "what are the
current rankings" — is inherently a request that expects an answer right now. A
message broker doesn't remove the need for a response to that question; at best it
adds an extra hop in between for the same synchronous need. Since rankings are now
served from a pre-computed snapshot (see Background Processing above) rather than
computed live, this call is already fast and cheap, which reduces the actual cost of
keeping it as a direct HTTP request.

Where an event-based approach genuinely fits is notifying other parts of the system
that something changed, without the publisher needing to know who's listening — for
example, "rankings were just recomputed" is a real event, not a query. I've documented
this as the natural next step rather than implementing a message broker purely to
route a request that isn't actually asynchronous by nature. Given the time available,
I chose to prioritize getting the layering, auth, validation, and background job
correct over adding new infrastructure (a broker + its client in both services) for a
single event with no current subscriber logic beyond a placeholder.

If I were to build this out, I'd keep `GET /internal/rankings/*` as a direct HTTP
call, and add a `rankings.updated` event published by User Service after each
recompute, which Admin Service (or any future service) could subscribe to for cache
invalidation or triggering its own follow-up work — without ever needing to know User
Service's address directly.

## Assumptions I made

- Views increment on every request to a post's detail page, without checking if it's
  the same user viewing twice. Unique-per-user views would require forcing login just
  to view a post, which felt like the wrong trade-off here.
- The 10 categories are hardcoded as a constant rather than stored in the DB, since
  the spec fixes them at 10 and doesn't ask for admin-configurable categories.
- Contest weeks are relative to a fixed start date in config, not calendar weeks.
- Media is stored on local disk, not S3/Cloudinary, since the assignment explicitly
  allows that. In a real deployment this would only change how `media.url` is
  generated — no schema change needed.
- The shared-secret header between services is good enough for this assignment, but
  wouldn't be production-grade internal auth on its own.
- Admins are `User` documents with `role: "admin"` rather than a separate login
  system, since the assignment didn't ask for a distinct admin identity model.

## Known limitation

If two KYC failures are processed at almost the exact same moment and both would
cascade to the same replacement candidate, there's a small race window where they
could both grab the same slot. The fix is to wrap the "find next candidate" and
"create replacement" steps in a single Postgres transaction so the second failure
re-checks availability inside the lock instead of outside it — noted here rather than
fully implemented due to time.

## Testing

Tests cover the scenarios the assignment specifically calls out: an ineligible user
who'd otherwise top the rankings, a tie score that needs the tie-break rule, someone
who just barely misses consistency by one week, the multi-category collapse cascading
correctly to the next person, a category running out of candidates with no backfill,
and a KYC failure chaining through multiple replacements. Ranking tests run against an
in-memory Mongo instance; cascade/KYC tests mock the call to User Service so they
don't depend on both services running at once.

## Running it

Both services need to run at the same time in dev — they're on different ports and
talk to each other over HTTP, not a shared process. Both need the same `JWT_SECRET`
and `INTERNAL_SERVICE_SECRET` values in their `.env` files, or token verification and
internal ranking calls will get rejected.
