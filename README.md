# Meeting Room Booking

A web app for booking a meeting room during the workday **09:00–18:00**.

Stack: **Next.js** (App Router) + **TypeScript**, mock API via Route Handlers, API client separated from the UI, domain validation in `src/domain/`.

## Requirements

- Node.js 20+
- npm

## Setup and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Unit tests (Vitest, single run) |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint |

## Booking rules

- Work window: **09:00–18:00**
- `start < end`
- Duration: **30 minutes to 2 hours**
- Overlaps are not allowed; **touching boundaries is allowed** (e.g. `10:00–11:00` and `11:00–12:00`)
- Past dates — create/edit is not available
- For today, slots earlier than the current time cannot be selected
- On edit, the current booking is excluded from overlap checks (`excludeId`)
- On conflict the API returns **409**; the UI refreshes the list and **does not reset** the form

Data is stored in memory (with demo seeds for past/today/future dates). After a server restart the store resets to the seeds.

## Structure

```
src/
  domain/          # types, constants, time, slots, validation (+ tests)
  api/client.ts    # HTTP client for the UI
  app/api/bookings # CRUD Route Handlers
  components/      # UI
  lib/             # in-memory store and seeds
```

## Tests

Domain unit tests with **Vitest** (`src/domain/*.test.ts`).

| File | Coverage |
| --- | --- |
| `time.test.ts` | Date/time format, duration, half-open overlap (touching boundaries), past time |
| `slots.test.ts` | Slot generation, filtering past starts for today, end slots 30 min–2 h |
| `validation.test.ts` | Workday, min/max duration, `PAST_DATE`, `IN_THE_PAST`, `OVERLAP`, `excludeId` |

Run:

```bash
npm test
```
