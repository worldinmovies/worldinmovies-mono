# Research Brief: Country Landing Pages with CountryPage Component

**Task:** Implement country landing pages with a new CountryPage component for SEO optimization.

---

## Domain
devops + design (frontend UI patterns, SEO)

---

## Refined Requirements

| # | Requirement | Definition of Done |
|---|-----------|-------------------|
| 1 | Create a new `CountryPage` component with its own layout and features | Component exists, is lazy-loaded via route, renders filtered MovieGrid |
| 2 | Use existing patterns: lazy routes, Shadcn UI | Follow `FAQ.tsx`, `About.tsx` patterns; use Shadcn `Card`, `Button`, `Badge`, `Separator`, etc. |
| 3 | Implement SEO-friendly meta tags and structured data | Pass `useSEO` with `WebSite` + `Country` JSON-LD schema on `/country/:code` routes |
| 4 | Implement a MovieGrid filtered by country | Re-use existing `MovieGrid` or create a country-specific wrapper that passes country code |
| 5 | Mobile-friendly & responsive | Use Tailwind responsive classes (`sm:`, `md:`, `xl:`) as seen in existing pages |

---

## Open Questions Answered (user confirmed)

| # | Question | Answer |
|---|----------|--------|
| 1 | URL format for country pages | `/country/:code` (e.g. `/country/jp`) — aligns with backend API and flagcdn.org |
| 2 | Include a /countries index page? | No — scope is limited to individual country landing pages |

---

## Web Findings

* **React Lazy Routing Pattern** – The codebase uses `lazy(() => import(...))` with `Suspense` fallback in `App.tsx` for all top-level pages (Index, FAQ, About, etc.).
* **Shadcn UI Components** – Components like `Card`, `Button`, `Badge`, `Separator`, `Dialog`, `DropdownMenu` are already installed via `@/components/ui/*`.
* **SEO Best Practices for Country Pages** – Google recommends:
  * Unique, language-rich title tags per country (e.g., “Japanese Cinema – Top Films from Japan | World in Movies”)
  * Structured data: `WebSite` + `Country` or `Movie` schema in JSON-LD
  * Mobile-first responsive tables (good for flag/name lists)
  * Internal linking from homepage or sitemap

---

## App Source Findings

### File Map – Relevant Existing Patterns

| File | Role |
|------|------|
| `apps/webapp/src/App.tsx` | Route definitions with lazy imports and `Suspense` fallback |
| `apps/webapp/src/pages/FAQ.tsx` | Example new page using `useSEO` with `FAQPage` schema |
| `apps/webapp/src/pages/About.tsx` | Example existing page with `Organization` schema |
| `apps/webapp/src/pages/Privacy.tsx` | Simple page, minimal SEO schema |
| `apps/webapp/src/components/CountryFilter.tsx` | Dropdown + globe map, uses flag CDN (`https://flagcdn.com/`) |
| `apps/webapp/src/components/MovieGrid.tsx` | Main movie list with infinite scroll, accepts country filter via `useMovies` |
| `apps/webapp/src/hooks/useMovies.ts` | Fetches from `/view/best/:countryCode` endpoint |
| `apps/webapp/src/hooks/useSEO.ts` | Updates `<title>`, meta description, OG/Twitter cards, canonical, JSON-LD — includes cleanup on unmount |
| `apps/webapp/src/components/Flag.tsx` | Memoized React component, lazy-loading flag images from flagcdn |
| `apps/webapp/src/lib/models.ts` | `Movie` interface (id, title, year, country, countryCode, countryFlag, poster, rating, genres, description, director) |
| `apps/webapp/src/assets/countrycodes.json` | 256 ISO-3166-1 alpha-2 → country name mappings |
| `apps/webapp/src/components/MovieCard.tsx` | Individual movie card displayed in grid |
| `apps/webapp/src/components/ui/*.tsx` | Shadcn UI primitives (Card, Badge, Button, Separator, Dialog, etc.) |

### Existing Patterns to Follow

1. **Lazy Route Imports (App.tsx)**
   ```ts
   const FAQ = lazy(() => import("./pages/FAQ"));
   // ...
   <Route path="/faq" element={<FAQ />} />
   ```

2. **SEO Hook Usage (FAQ.tsx, About.tsx)**
   ```ts
   useSEO({
     title: "FAQ",
     description: "...",
     canonicalUrl: "https://worldinmovies.com/faq",
     structuredData: { ... }
   });
   ```

3. **Structured Data Example (FAQ.tsx → FAQPage schema)**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "FAQPage",
     "mainEntity": [{ "@type": "Question", "name": "...", "acceptedAnswer": { ... } }]
   }
   ```

4. **Page Layout (FAQ.tsx, About.tsx)**
   * `<main className="min-h-screen bg-background">`
   * Centered content via `max-w-3xl mx-auto` or `max-w-4xl mx-auto`
   * Hero heading with gradient text: `bg-gradient-accent bg-clip-text text-transparent`
   * Section spacing via `py-20 px-6`

5. **Country Code Utility (filters.ts)**
   ```ts
   buildCountryOptions(countryData: Record<string, string>): CountryOption[]
   // Returns { country, countryCode, flag } tuples
   ```

---

## Infra Findings (charts / kubernetes)

* No cluster-side state or databases are needed for this frontend-only feature. The app fetches from `VITE_TMDB_URL` (configurable via chart values).
* Ingress in `charts/webapp/templates/ingress.yaml` routes all traffic; new route `/country/:code` will work automatically on the existing host `worldinmovies.labb.site`.
* No extra storage classes, PVCs, or secrets required.

---

## Remaining Risks / Unknowns

| Risk | Mitigation |
|------|------------|
| SEO duplicate content if the same movie appears on multiple country pages | Use `<link rel="canonical">` pointing to the country landing page; let `MovieDetail` pages have their own canonical |
| Scalability of 256 individual routes (not a code issue, but potential bundle impact) | All pages are lazy-loaded, so only visited pages download code |
| Flag CDN reliability | `Flag.tsx` already handles image errors gracefully |

---

## Suggested Implementation Plan

1. **Create `apps/webapp/src/components/CountryPage.tsx`**
   * Props: `countryCode: string`
   * Fetch country name from `countrycodes.json`
   * Use `useSEO` with `WebSite` + `Country` schema
   * Render a hero section (title, flag, description)
   * Use existing `MovieGrid` logic filtered to selected country
   * Include back navigation and clear filter

2. **Create `apps/webapp/src/pages/CountryPageRoute.tsx` (page wrapper)**
   * Lazy-loaded by React Router
   * Extract `countryCode` from `useParams()
   * Pass to `<CountryPage countryCode={code} />`

3. **Update `apps/webapp/src/App.tsx`**
   * Add lazy import: `const CountryPageRoute = lazy(() => import("./pages/CountryPageRoute"))`
   * Add route: `<Route path="/country/:countryCode" element={<CountryPageRoute />} />`

4. **Create `apps/webapp/src/components/CountryPage.test.tsx`**
   * Follow `FAQ.test.tsx` and `About.test.tsx` patterns
   * Verify SEO hooks called with correct structured data

5. **Add to `sitemap.xml` or robots.txt** (optional post-deployment)

---

## Deliverable

A working `/country/:code` route with a dedicated `CountryPage` component that is SEO-optimized, lazy-loaded, and displays movies filtered by country using the existing `MovieGrid` pattern.