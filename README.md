# Workshop bookings

A small module for a caravan dealer: customers book a caravan in for a service in one of the dealer's service bays.

- `api/` Laravel (SQLite, Form Requests, Pest). CRUD for bookings and the no-overlap rule.
- `web/` Next.js App Router + TypeScript. Server components, Server Actions, URL-driven list.

## How to run

You need PHP 8.3+, Composer and Node 20+.

```bash
# 1. API  (http://127.0.0.1:8000)
cd api
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite          # skip if it already exists
php artisan migrate --seed              # seeds 18 bookings across 6 bays
php artisan serve

# 2. Web  (http://localhost:3000)
cd web
npm install
cp .env.example .env.local              # LARAVEL_API_URL=http://127.0.0.1:8000/api
npm run dev                             # or: npm run build && npm start
```

Tests: `cd api && vendor/bin/pest` (17 tests, including the concurrency test).

| Route | What it does |
|---|---|
| `/bookings?status=confirmed&page=2` | List: server component, status filter and page live in the URL |
| `/bookings/[id]` | Detail with a cancel action; a missing id shows a proper not-found page |
| `/bookings/new`, `/bookings/[id]/edit` | Forms backed by Server Actions |

The API is `apiResource('bookings')` under `/api`: `GET/POST /bookings`, `GET/PATCH/DELETE /bookings/{id}`, with `?status=` and `?per_page=` on the list.

## Senior write-up

**Caching and revalidation.** Reads are cached with `use cache` (`getBookings(status, page)`, `getBooking(id)`), tagged `bookings` and `booking-{id}`, with `cacheLife("minutes")`. The filter and page are function arguments, so every combination is its own cache entry and the URL stays the only state. Every Server Action ends with `updateTag(...)` on the list tag and the detail tag, because a user who saves a booking must see it on the next render, not a stale copy. I chose `updateTag` over `revalidateTag(..., "max")` for that reason: stale-while-revalidate is right for content, wrong for "I just booked the bay". Reading `searchParams` and `params` is request-time, so those reads sit in small async components behind `<Suspense>`: the shell streams immediately and the data fills in. Writes always go to Laravel uncached (`cache: "no-store"`).

**Two people booking the same slot at the same moment.** One writer path (`BookingScheduler`) does the check and the write together, under two guards. A per-bay cache lock (`Cache::lock("bookings:bay:N")`) serialises writers on any database. The check and insert then run in one transaction on a SQLite connection configured with `transaction_mode = IMMEDIATE`, which takes the write lock at `BEGIN`, so a second writer waits instead of reading "free" in parallel. Boundaries are half-open, so back-to-back bookings are allowed. `tests/Feature/BookingConcurrencyTest.php` starts eight real PHP processes against one SQLite file, all booking the same slot, and requires exactly one winner and seven clean validation errors. I confirmed the test fails when I remove both guards. The safety net is the database: this rule is not enforced by a constraint yet (see below).

**If this became one module in a multi-tenant platform for 200 dealers, first I would** add the tenant to everything: a `dealer_id` on `bookings`, a global scope so no query can forget it, a policy on every action, and the tenant in every cache key and tag (`dealer-{id}:bookings`). A query that forgets the company is a data leak, so the scope goes in before any feature. Second, move the overlap guarantee into the database: on PostgreSQL an exclusion constraint on `(dealer_id, service_bay, tstzrange(starts_at, ends_at))` where status is not cancelled, so no code path can double-book. Bay numbers would become a `service_bays` table per dealer, not a config number. Third, store UTC and display in the dealer's own time zone.

## What I used AI for, and where it got something wrong

I used **Claude Code** for most of the typing: scaffolding, the Form Requests, the controller, the Pest tests and the first pass of the Next.js pages. I chose the structure, the locking approach and the caching model, and I read every line before keeping it.

**Where it was wrong:** the first version stored `starts_at` and `ends_at` with Eloquent's `datetime` cast. A request carrying `2027-03-01T09:00:00+10:00` was saved as the local `09:00` with the offset thrown away, so the same instant sent as `23:00+00:00` the day before looked like a different time and the overlap rule would have missed the clash. The AI assumed the cast normalised to UTC. A test I wrote that sends the same instant in two offsets caught it ("compares instants, not clock times, when offsets differ"). The fix is explicit `Attribute` accessors on `Booking` that convert to UTC on the way in.

It also put shared constants in a `use cache` file that a client component imported, which breaks the build; I moved them to `lib/types.ts`.

## Known limits and what I would do next

- A missing booking shows a real not-found page with `noindex`, but the HTTP status is 200 because the page streams from a Suspense boundary. Returning a true 404 needs a cheap existence check in `proxy.ts` before streaming starts.
- Times are entered and shown in UTC to keep the demo honest; see the time zone point above.
- No authentication. Laravel validation messages are shown as returned.
- No browser-level (Playwright) tests. I verified the flow by script: filter and pagination from the URL, overlap error beside the start field with typed values kept, create and cancel without a full page reload.
