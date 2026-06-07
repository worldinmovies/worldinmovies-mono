# SEO & AEO Audit Plan for globe-reel-gems

## Executive Summary

This document outlines a comprehensive plan for conducting a Search Engine Optimization (SEO) and Answer Engine Optimization (AEO) audit of the `globe-reel-gems` project. The audit will evaluate the application's current search visibility, identify optimization opportunities, and provide actionable recommendations.

---

## Phase 1: Technical SEO Assessment

### 1.1 Crawlability & Indexation
- [ ] Verify `robots.txt` configuration (currently at `public/robots.txt`)
- [ ] Check for proper meta robots tags on all pages
- [ ] Validate XML sitemap presence and structure
- [ ] Identify any crawl barriers (JS-rendered content, dynamic routes)
- [ ] Check for canonical URL configuration

### 1.2 Performance Metrics
- [ ] Run Google PageSpeed Insights analysis
- [ ] Measure Core Web Vitals (LCP, FID, CLS)
- [ ] Evaluate bundle size and code splitting
- [ ] Check image optimization (WebP, lazy loading)
- [ ] Assess server response times and caching headers

### 1.3 Mobile Optimization
- [ ] Verify responsive design across viewport sizes
- [ ] Check touch target sizes and spacing
- [ ] Validate viewport meta tag configuration
- [ ] Test PWA capabilities (manifest.json, service worker `sw.js`)
- [ ] Evaluate offline functionality

### 1.4 URL Structure & Routing
- [ ] Review URL patterns and hierarchy
- [ ] Validate React Router configuration
- [ ] Check for proper 404/error page handling
- [ ] Verify redirect chains and loops

---

## Phase 2: On-Page SEO Analysis

### 2.1 Title Tags & Meta Descriptions
- [ ] Audit all page title tags for uniqueness and relevance
- [ ] Verify title tag length (50-60 characters optimal)
- [ ] Check meta description quality and length (150-160 characters)
- [ ] Verify Open Graph meta tags
- [ ] Check Twitter Card meta tags

### 2.2 Content Structure & Hierarchy
- [ ] Validate H1-H6 heading structure on all pages
- [ ] Check for proper heading hierarchy (single H1 per page)
- [ ] Review content organization and readability
- [ ] Evaluate internal linking structure

### 2.3 Image Optimization
- [ ] Check alt text on all meaningful images
- [ ] Verify proper image dimensions and aspect ratios
- [ ] Evaluate image compression and format usage
- [ ] Check for lazy loading implementation

### 2.4 Structured Data & Schema Markup
- [ ] Audit JSON-LD structured data implementation
- [ ] Verify schema.org markup for relevant content types
- [ ] Check for rich snippet eligibility
- [ ] Validate schema with Google's Structured Data Testing Tool

---

## Phase 3: AEO (Answer Engine Optimization)

### 3.1 Featured Snippet Opportunities
- [ ] Identify question-based queries relevant to content
- [ ] Optimize content for position-zero snippets
- [ ] Create FAQ sections where appropriate
- [ ] Structure content for direct answers (paragraphs, lists, tables)

### 3.2 Voice Search Optimization
- [ ] Optimize for conversational, long-tail queries
- [ ] Include natural language patterns
- [ ] Create content answering "who, what, where, when, why, how"
- [ ] Optimize for local search intent

### 3.3 Knowledge Panel & Entity Optimization
- [ ] Verify entity consistency across platforms
- [ ] Optimize for knowledge graph inclusion
- [ ] Create comprehensive about/contact pages
- [ ] Establish brand authority signals

### 3.4 AI Overviews & Generative AI Optimization
- [ ] Structure content for AI reference (clear, authoritative)
- [ ] Include citations and source attribution
- [ ] Create expert/author attribution content
- [ ] Optimize for E-E-A-T (Experience, Expertise, Authoritativeness, Trust)

---

## Phase 4: Content Audit

### 4.1 Content Inventory
- [ ] Catalog all pages and content types
- [ ] Identify content gaps and opportunities
- [ ] Assess content freshness and relevance
- [ ] Evaluate content depth and comprehensiveness

### 4.2 Keyword Analysis
- [ ] Identify primary and secondary keywords per page
- [ ] Check keyword density and natural usage
- [ ] Evaluate long-tail keyword opportunities
- [ ] Assess competitive keyword landscape

### 4.3 User Intent Matching
- [ ] Classify pages by search intent (informational, navigational, transactional)
- [ ] Verify content matches intended user journey
- [ ] Identify mismatched intent pages

---

## Phase 5: Technical Infrastructure Review

### 5.1 Build & Deployment Configuration
- [ ] Review `vite.config.ts` for optimization settings
- [ ] Check `Dockerfile` configuration
- [ ] Evaluate nginx configuration for caching and compression
- [ ] Verify production build optimization

### 5.2 Framework-Specific Considerations
- [ ] Assess React rendering strategy (CSR vs SSR)
- [ ] Check for hydration issues
- [ ] Evaluate code-splitting and lazy loading
- [ ] Review bundle analysis results

### 5.3 Integration Points
- [ ] Check integration with external APIs/services
- [ ] Validate API response times and error handling
- [ ] Review `countrycodes.json` and GeoJSON data usage
- [ ] Evaluate `capacitor.config.ts` for mobile app configuration

---

## Phase 6: Competitive Analysis

### 6.1 Competitor Benchmarking
- [ ] Identify top competitors in search results
- [ ] Analyze competitor SEO strategies
- [ ] Compare keyword rankings
- [ ] Evaluate content quality and depth

### 6.2 Backlink Profile
- [ ] Assess current backlink presence
- [ ] Identify link building opportunities
- [ ] Check for toxic or spammy links

---

## Phase 7: Reporting & Recommendations

### 7.1 Audit Deliverables
- [ ] Comprehensive audit report with findings
- [ ] Prioritized action items (Critical, High, Medium, Low)
- [ ] Before/after metrics framework
- [ ] Implementation roadmap and timeline

### 7.2 Implementation Plan
- [ ] Quick wins (immediate impact, low effort)
- [ ] Short-term improvements (1-4 weeks)
- [ ] Medium-term strategy (1-3 months)
- [ ] Long-term initiatives (3+ months)

---

## Tools & Resources

### Recommended Tools
- **Google Search Console** - Indexation and performance data
- **Google Analytics** - Traffic and user behavior
- **PageSpeed Insights** - Performance metrics
- **Screaming Frog** - Crawl analysis
- **Ahrefs/Semrush** - Keyword and competitor analysis
- **Google Rich Results Test** - Structured data validation
- **Mobile-Friendly Test** - Mobile usability

### Project-Specific Files to Review
- `index.html` - Base HTML structure and meta tags
- `public/robots.txt` - Crawl directives
- `public/manifest.json` - PWA configuration
- `vite.config.ts` - Build optimization settings
- `src/App.tsx` - Routing configuration
- `src/pages/*` - All page components
- `src/components/*` - Reusable components

---

## Timeline Estimate

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Technical SEO | 1-2 days | Critical |
| Phase 2: On-Page SEO | 1 day | High |
| Phase 3: AEO | 1-2 days | High |
| Phase 4: Content Audit | 1 day | Medium |
| Phase 5: Infrastructure | 0.5-1 day | Medium |
| Phase 6: Competitive Analysis | 1 day | Medium |
| Phase 7: Reporting | 0.5 day | Critical |

**Total Estimated Time: 5-7 business days**

---

## Audit Findings Summary

### Phase 1: Technical SEO ✅
- **Good**: robots.txt allows all bots, canonical URL set, PWA configured, mobile viewport set
- **Issues**: No dynamic meta per page, no structured data (JSON-LD), no XML sitemap, CSR-only (no SSR), basic service worker (only caches 3 URLs), no gzip/brotli compression config in nginx, no cache-control headers

### Phase 2: On-Page SEO ✅
- **Good**: H1 tags present, proper heading hierarchy, alt text on images, 404 page configured
- **Issues**: All pages share same static meta tags, no structured data, generic image alt text, no FAQ sections, no internal linking strategy

### Phase 3: AEO ✅
- **Issues**: No FAQ sections, no structured Q&A content, no voice search optimization, no "best/top/guide" content, no entity/brand pages, no Movie schema markup, content is app-like not content-driven

### Phase 4: Content Audit ✅
- **Issues**: App-like interactive tool (not content-driven), no blog/articles/evergreen content, no page-specific keywords, no author/creator attribution, no landing pages for specific topics

### Phase 5: Technical Infrastructure ✅
- **Good**: gzip compression, TLS 1.3, security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection), SSL stapling, PWA service worker
- **Issues**: No cache-control headers, no Content-Security-Policy, HSTS commented out, server_tokens not disabled, no brotli compression, no HTTP/2, no CDN, no preload/preconnect hints

### Phase 6: Competitive Analysis ✅
- **Positioning**: Interactive movie tracking app for international film enthusiasts
- **Competitors**: Letterboxd, IMDb, JustWatch, FilmAffinity
- **Opportunities**: Country-specific pages, director filmographies, "best of" collections, film festival coverage, genre deep-dives

---

## Prioritized Recommendations

### 🔴 Critical (Immediate)
1. **Add dynamic meta tags per page** - Use react-helmet-async or similar for page-specific titles/descriptions
2. **Implement JSON-LD structured data** - Add Movie schema markup to movie detail pages
3. **Create XML sitemap** - Auto-generate sitemap for all discoverable routes
4. **Add FAQ section** - Create FAQ page for common questions about world cinema

### 🟡 High Priority (1-4 weeks)
5. **Create country-specific landing pages** - e.g., "Japanese Cinema", "French New Wave"
6. **Add director filmography pages** - Link from movie cards to director pages
7. **Optimize image alt text** - Make descriptions more specific and keyword-rich
8. **Add cache-control headers** - Configure nginx for static asset caching
9. **Create "About" page** - Establish brand/entity signals for E-E-A-T

### 🟢 Medium Priority (1-3 months)
10. **Develop evergreen content** - Add blog/articles for SEO traffic
11. **Create "Best of" collections** - Top 100 World Cinema, etc.
12. **Implement Content-Security-Policy** - Add CSP header for security
13. **Enable HSTS** - Uncomment and configure Strict-Transport-Security
14. **Add preload/preconnect hints** - For critical resources

### 🔵 Long-term (3+ months)
15. **Consider SSR/SSG** - For content pages (Next.js or Vite SSR)
16. **Implement CDN** - For global content delivery
17. **Add author attribution** - For E-E-A-T signals
18. **Create film festival coverage** - Cannes, Venice, Berlin, etc.

---

## Implementation Roadmap

| Phase | Actions | Timeline |
|-------|---------|----------|
| **Week 1** | Dynamic meta tags, JSON-LD, XML sitemap | 1 week |
| **Weeks 2-4** | Country pages, director pages, FAQ section, cache headers | 3 weeks |
| **Months 2-3** | Evergreen content, "Best of" collections, About page | 2 months |
| **Months 3+** | SSR/SSG for content, CDN, author attribution, festival coverage | Ongoing |

---

## Next Steps

1. ✅ Create this audit plan (completed)
2. ✅ Execute Phase 1: Technical SEO Assessment (completed)
3. ✅ Execute Phase 2: On-Page SEO Analysis (completed)
4. ✅ Execute Phase 3: AEO (completed)
5. ✅ Execute Phase 4: Content Audit (completed)
6. ✅ Execute Phase 5: Technical Infrastructure (completed)
7. ✅ Execute Phase 6: Competitive Analysis (completed)
8. ✅ Compile findings into final report (completed)
9. 🔄 Present recommendations and implementation roadmap
