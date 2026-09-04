# Contest Ranking Engine

This is my submission for the contest ranking engine assignment. It's split into two
independent services (User Service and Admin Service) plus a React frontend, exactly
as asked. Below I've explained how the data is modeled, how the two services talk to
each other, and the assumptions I made along the way where the spec left something open.

## Why two services

User Service owns everything about users, posts, likes, comments and views. It's on
MongoDB because that data is document-ish and grows fast (posts, likes, comments).

Admin Service owns winners and KYC status. It's on Postgres + Prisma because that data
is relational and needs to be reliable — a winner should never accidentally exist twice,
and I wanted the DB itself to help enforce that.

The important rule I stuck to: Admin Service never touches User Service's database
directly. It only talks to it over HTTP, through a small set of internal routes. That
keeps the two services actually independent — you could swap out either database
without the other service knowing.

## Data model

**User Service (Mongo)**
- `User` — email, hashed password, username, and a `residency` field. Only people with
  `residency: "Chhattisgarh"` are contest-eligible. I kept eligibility as a single
  check against this field rather than scattering "Chhattisgarh" string checks
  everywhere, so it's easy to change later.
- `Post` — creator, caption, category (one of 10 fixed categories), media info, and a
  `counts` object (likes/comments/views). I also store `score` directly on the post and
  keep it updated with atomic `$inc` operations whenever a like/comment/view happens,
  instead of recalculating it from scratch every time. That was mostly for performance —
  the ranking engine reads `score` directly instead of re-deriving it from raw counts
  on every single ranking request.
- `Like` — its own collection, not just a counter, with a unique index on
  `(post, user)`. This is what actually stops someone from double-liking a post if two
  requests land at the same time — the DB rejects the second insert, so there's no race
  window in application code.
- `Comment` — its own collection too, since comments are actual content people should
  be able to read back, not just a number.

**Admin Service (Postgres/Prisma)**
- `Winner` — one row per person who's currently holding (or used to hold) a prize.
  Has a `tier` (Grand Prize, Consistency 1st/2nd, Top Performer, Category 1st/2nd), a
  `status` (ACTIVE or CASCADED), and a `userId` that refers back to a Mongo user — this
  is just a plain string, not a real foreign key, because Postgres has no way to
  validate a reference into a completely different database. I noted this as a known
  limitation rather than pretending it's enforced.
- `KycRequest` — one per winner, tracks pending/passed/failed.
- I kept `CASCADED` winners in the table instead of deleting them, so there's a full
  audit trail of who lost a prize and why. Each replacement winner points back to the
  person they replaced via `cascadedFromId`, so you can follow the whole chain if
  someone fails KYC, gets replaced, and that replacement also fails.

## How the two services talk (API contract)

User Service exposes a few internal-only endpoints that Admin Service calls:

```
GET /internal/rankings/global        -> best post per creator, sorted
GET /internal/rankings/category      -> best post per creator per category, for all 10 categories
GET /internal/rankings/consistency   -> creators who qualify + their consistency score
```

These aren't meant to be public. They're protected by a shared secret header
(`x-internal-secret`) that both services know from their `.env` files. It's not a real
production-grade solution (in a real system I'd use something like mTLS or a private
network) but it's enough to make sure a random JWT-holding user can't hit these routes
and pull everyone's ranking data.

Admin Service's public routes (used by the frontend):
```
GET  /admin/winners?tier=...          -> list current winners, optionally filtered by tier
POST /admin/winners/:id/kyc           -> body: { passed: true/false }, triggers cascade on failure
```

## The ranking logic

Score per post is `likes*1 + comments*3 + views*0.2`. Ties break by comments, then
views, then whichever post was created first. This tie-break is baked into a single
`comparePosts()` helper used everywhere, so I'm not repeating the same three-way
comparison logic in three different places.

**Global** — for every eligible creator, take their single best post, rank those.

**Category** — same idea, but done separately per category (10 independent rankings).

**Consistency** — only creators who posted 3+ times in every one of the 4 contest
weeks qualify at all. If they qualify, their score is the sum of their top 3 posts'
scores in each week, added up across all 4 weeks. Weeks are calculated relative to a
fixed `CONTEST_START_DATE` constant rather than calendar weeks, so "week 1" always
means "the first 7 days of the contest" regardless of what day of the week it starts on.

One thing I want to flag honestly: the spec defines the tie-break rule at the post
level (comments, views, timestamp), but doesn't say how to break a tie between two
*creators'* consistency scores. I extended the same logic down to the creator's best
qualifying post as a reasonable default, but this is an assumption I made, not
something explicitly asked for.

## The prize cascade

This was the hardest part, so here's the order I process things in, exactly as
specified:

1. Grand Prize (1)
2. Consistency 1st (1)
3. Consistency 2nd (1)
4. Top Performers (10 distinct people, from the Global ranking)
5. Category 1st (10, one per category)
6. Category 2nd (10, one per category, no backfill if a category runs out of people)

Everyone can only win once, total. Once someone's been given a prize at a higher tier,
they're skipped everywhere else.

The trickiest bit is category collapse: if the same person is #1 in more than one
category, they only keep the category where their post scored highest, and the other
category's slot goes to whoever's next in line for that category. I resolve this in a
loop rather than a single pass, because the person who gets promoted into a freed-up
slot could themselves collide with yet another category — so it keeps resolving until
nothing's colliding anymore. I chose "highest score" as the tie-break for which
category someone keeps since the spec didn't specify this either, and it felt like the
most defensible, data-driven choice.

If a category genuinely runs out of eligible people (say, only one person ever posted
in that category), the 2nd place for that category is just left unawarded. I didn't
build any kind of backfill to 3rd place, since the spec explicitly says not to.

## KYC and cascading on failure

When admin marks someone's KYC as failed, that winner is marked `CASCADED` (not
deleted — I want the history), and the system looks for the next eligible person for
that exact same tier/category. If that replacement *also* fails KYC later, the same
process runs again on them — it's not a special "second failure" code path, it's the
same function, so it naturally chains as many times as it needs to.

## Assumptions I made

- Views increment on every request to a post's detail page, without checking if it's
  the same user viewing twice. I considered adding unique-per-user views (same idea as
  likes), but that would require forcing people to log in just to view a post, which
  felt like the wrong trade-off for this assignment. I noted this as a deliberate
  simplification rather than an oversight.
- The 10 categories are hardcoded as a constant rather than stored in the DB, since the
  spec fixes them at 10 and doesn't ask for admin-configurable categories.
- Contest weeks are relative to a fixed start date I set in config, not calendar weeks.
- Media is stored on local disk, not S3/Cloudinary, since the assignment explicitly
  says that's fine. In a real deployment this would just be a change to how `media.url`
  gets generated — no schema change needed.
- The shared-secret header between services is good enough for this assignment, but
  I wouldn't consider it production-grade internal auth.

## Known limitation

If two KYC failures get processed at the exact same moment and both would cascade to
the same replacement person, there's a small race window where they could both grab
the same slot. I didn't fully harden this with a DB transaction + row lock due to time,
but the fix is straightforward: wrap the "find next candidate" + "create replacement"
steps in a single Postgres transaction so the second failure re-checks availability
inside the lock instead of outside it.

## Testing

Tests cover the scenarios the assignment specifically calls out: an ineligible user
who'd otherwise top the rankings, a tie score that needs the tie-break rule, someone
who just barely misses consistency by one week, the multi-category collapse cascading
correctly to the next person, a category running out of candidates with no backfill,
and a KYC failure chaining through multiple replacements. Ranking tests run against an
in-memory Mongo instance; cascade/KYC tests mock the call to User Service so they don't
depend on both services running at once.

## Running it

Both services need to run at the same time in dev — they're on different ports and
talk to each other over HTTP, not a shared process. Both need the same
`INTERNAL_SERVICE_SECRET` value in their `.env` files or the internal ranking calls
will get rejected.
