# Google Stitch — TasteAI Frontend Design

## Stitch Prompt

Design a premium dark-mode single-page web app called **TasteAI** — an AI-powered restaurant recommendation system. The layout has two columns: a 320px left filter panel and a flexible right results panel, with a sticky glassmorphism top nav bar showing the "TasteAI" wordmark (with a fork + sparkle icon) on the left and a light/dark toggle pill on the right.

The filter panel starts with a bold hero headline "Find your perfect meal." in Outfit 700 and a muted subtext "Tell us what you're craving — our AI does the rest." Below that is a glassmorphism card (rgba white 4% background, blur, subtle border) containing: a Location dropdown (Delhi, Mumbai, Bangalore, etc.), a Cuisine dropdown (North Indian, Italian, Chinese, etc.), a Budget selector as three pill buttons (Low / Medium / High) where the selected pill fills with an amber-to-red gradient (#F97316 → #EF4444), a minimum rating slider (1.0–5.0) with a floating badge showing the current value like "⭐ 3.5+", a textarea for additional notes with a character counter, and a full-width CTA button "Find Restaurants →" with the same amber-red gradient, shimmer on hover, and a press-down scale animation.

The right results panel shows 3 restaurant recommendation cards. Each card is a glassmorphism panel (dark translucent background, 1px subtle border, 16px radius) that lifts with translateY(-4px) and glows with an amber border on hover and fades in with a staggered animation. Each card shows: the restaurant name in Outfit 700 20px with a cost badge (₹ / ₹₹ / ₹₹₹) top-right, a row of small pill tags for cuisine and location plus an amber star rating, a divider, then an "🤖 WHY WE PICKED THIS" label in amber uppercase followed by the AI explanation in italic Inter 400 inside a left-bordered amber blockquote, and small green badge pills at the bottom for "Online Order" and "Table Booking."

Also design a loading skeleton state (3 cards with animated left-to-right shimmer blocks) and an empty state (centered icon, "No recommendations yet" heading, muted instruction text). Use color tokens: background #0D1117, cards rgba(255,255,255,0.03), accent #F97316→#EF4444, primary text #F9FAFB, muted text #9CA3AF, ratings #FBBF24. Typography: Outfit for headings, Inter for body. The overall feel should be inspired by Linear.app and Vercel — refined, spacious, and ultra-premium. Generate all 3 screens: empty state, loading skeleton, and populated results.

---

## Generated Screens

### Screen 1 — Empty State
- Two-column layout with sidebar nav (Discovery, Saved, History, Preferences, Settings).
- Filter chips (Sushi, Italian, Spicy, Late Night) and a distance slider in the filter panel.
- Centered empty state: fork icon in a dark circle, "No recommendations yet" heading, muted instruction text.
- "Try asking for:" prompt card with an example query in italics.
- Sticky "Find Restaurants" CTA button at the bottom of the sidebar.

### Screen 2 — Loading Skeleton
- Same sidebar with Discovery active.
- Results panel shows a large skeleton card (top) + 2 smaller skeleton cards in a grid below.
- Each skeleton card has animated shimmer placeholder blocks mimicking: title bar, subtitle bar, tag pills, explanation box.

### Screen 3 — Populated Results
- Sidebar shows "ACTIVE FILTERS" summary: Location chips (Delhi, Mumbai, Bangalore), Cuisine (Multiple Cuisines), Budget (Medium ₹₹, High ₹₹₹).
- Results header: "Curated Top Picks" / "Based on your refined taste profile and real-time availability."
- 3 restaurant cards with real food photography:
  - **The Gilded Fork** — North Indian · Delhi · ⭐ 4.9 · ₹₹₹ · AI explanation · Online Order + Table Booking badges.
  - **Pasta & Co.** — Italian · Mumbai · ⭐ 4.7 · ₹₹ · AI explanation · Online Order badge.
  - **Spice Route** — Chinese · Bangalore · ⭐ 4.8 · ₹₹ · AI explanation · Online Order + Table Booking badges.

---

## Design Decisions Carried Into Implementation

| Decision | Detail |
|---|---|
| **Restaurant card images** | Cards include a photo area — implementation uses a placeholder gradient with emoji fallback |
| **Active Filters panel** | Sidebar shows a summary of applied filters after search, built into `app.js` state |
| **Sidebar nav structure** | Discovery / Saved / History / Preferences / Settings links (stubs for future routing) |
| **Grid layout for results** | Cards rendered in a responsive CSS grid (`auto-fill, minmax(340px, 1fr)`) |
| **Color palette** | Amber-orange accent (#F97316 → #EF4444) replacing the original neon-violet theme |
| **Typography** | Outfit 700 for headings, Inter 400/500 for body — imported from Google Fonts |

---

## Implementation Reference

The Stitch output directly informed **Phase F1** (design tokens) and **Phase F2** (layout scaffold) in the implementation plan.  
See [`implementation-plan.md`](./implementation-plan.md) — Frontend Track phases F1–F5.
