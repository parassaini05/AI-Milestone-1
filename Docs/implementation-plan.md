# Implementation Plan - AI-Powered Restaurant Recommendation System

This plan outlines the phase-wise development of the AI-Powered Restaurant Recommendation System. The system ingests Zomato data, stores/caches it in SQLite, programmatically filters candidates, and uses the Groq API to rank and explain recommendations.

## User Review Required

> [!IMPORTANT]
> - **Groq Model Selection**: We need to decide which model to target on Groq (e.g., `llama3-8b-8192` for low latency and cost, or `llama3-70b-8192` for more nuanced reasoning). We recommend starting with `llama-3.1-8b-instant` or `llama3-8b-8192`.
> - **Tech Stack Stack Choice**: We propose using **Node.js (Express)** for the backend and **Vanilla HTML/CSS/JS** (incorporating Google Fonts and CSS grid) for the frontend web app to achieve a sleek, premium look. Alternatively, we can use a Python stack (FastAPI + Pandas).

## Open Questions

> [!WARNING]
> - **Groq API Key**: You will need to provide a `GROQ_API_KEY` in the `.env` file once execution begins.
> - **Budget Categorization Logic** ✅ RESOLVED: The dataset uses INR (Indian Rupees) as cost-for-two. Thresholds confirmed:
>   - **Low**: ≤ ₹500 — street food, dhabas, fast food
>   - **Medium**: ₹501 – ₹1500 — casual dining, cafes, mid-range
>   - **High**: > ₹1500 — premium / fine dining

---

## Proposed Changes

### [Backend & Database Layer]

#### [CREATED] [db.js](file:///d:/Projects%20-%20Cursor%20&%20Antigravity/src/db.js)
Establish SQLite connection, define schema, and export methods to insert and query candidate restaurants.

#### [CREATED] [ingester.js](file:///d:/Projects%20-%20Cursor%20&%20Antigravity/src/ingester.js)
Script to fetch the Zomato dataset from Hugging Face, parse CSV/JSON format, apply basic cleanups (handling null values and categories), and seed the local SQLite database.

#### [NEW] [groqClient.js](file:///d:/Projects%20-%20Cursor%20&%20Antigravity/src/groqClient.js)
Integrate with the `@groq/groq-sdk` or perform standard HTTPS POST requests to the Groq API. Configure it to use JSON Mode to ensure structured output.

#### [CREATED] [server.js](file:///d:/Projects%20-%20Cursor%20&%20Antigravity/src/server.js)
Express server hosting the `/api/recommendations` endpoint. Orchestrates database filtering, formats the prompt, calls the Groq client, and sends back recommendations.

### [Frontend UI Layer]

#### [NEW] [index.html](file:///d:/Projects%20-%20Cursor%20&%20Antigravity/public/index.html)
Interactive web client featuring user preference controls (Dropdowns for Location/Cuisine, radio buttons for Budget, and a text input for custom details).

#### [NEW] [style.css](file:///d:/Projects%20-%20Cursor%20&%20Antigravity/public/style.css)
Modern stylesheet implementing glassmorphism, dynamic transitions, Outfit/Inter typography, and premium card layouts for restaurant list outputs.

#### [NEW] [app.js](file:///d:/Projects%20-%20Cursor%20&%20Antigravity/public/app.js)
Handles frontend state, form submission, asynchronous fetching from `/api/recommendations`, loading spinner states, and dynamic DOM rendering.

---

## Phases of Implementation

---

### 🔧 Backend Track

#### Phase B1: Environment & Database Setup [COMPLETED]
- [x] Set up directory structure.
- [x] Initialize `package.json` and install required dependencies (`express`, `dotenv`, `sqlite3`, `csv-parser`, `groq-sdk`).
- [x] Create and verify the local SQLite database schema.

#### Phase B2: Ingestion Pipeline [COMPLETED]
- [x] Download Zomato data chunk from Hugging Face dataset URL.
- [x] Implement the streaming CSV ingester to extract relevant columns and populate SQLite.
- [x] Verify seeding status with a database test query.

#### Phase B3: Deterministic Filtering & API Routes [COMPLETED]
- [x] Setup Express router.
- [x] Implement candidate selection logic: filters location, cuisine, minimum rating, and budget.
- [x] Write tests confirming correct matching bounds.

#### Phase B4: Groq API Orchestration
- [ ] Configure system prompt and model parameters (e.g., `llama-3.1-8b-instant`).
- [ ] Construct contextual prompt injecting retrieved candidate details (name, rating, cuisine, cost).
- [ ] Enable JSON Mode on the Groq client to ensure structured, parseable output.
- [ ] Implement error handling and graceful fallback if Groq API fails or returns invalid JSON.
- [ ] Expose full recommendation payload (`name`, `rating`, `cuisine`, `why`, `price_range`) from `/api/recommendations`.

---

### 🎨 Frontend Track

#### Phase F1: Design System & Foundation
- [ ] Define CSS custom properties (design tokens): color palette, typography scale, spacing, border-radius, shadows, and z-index layers.
- [ ] Import premium Google Fonts (`Outfit` for headings, `Inter` for body text).
- [ ] Establish a dark-mode base theme with rich background gradients (deep navy / charcoal).
- [ ] Create reusable utility classes for flex/grid layouts and responsive breakpoints.

#### Phase F2: Core Layout & Structure
- [ ] Build `index.html` semantic structure: `<header>`, `<main>`, `<aside>` (filter panel), `<section>` (results area), `<footer>`.
- [ ] Implement a two-column responsive grid (filter sidebar + results feed) that collapses to a single column on mobile.
- [ ] Add an animated hero/banner area with a subtle radial gradient backdrop and a short tagline.
- [ ] Create a persistent top navigation bar with the app logo, a search hint, and a theme toggle (light/dark).

#### Phase F3: Filter Form & Input Components
- [ ] Design a glassmorphism filter card (`backdrop-filter: blur`, translucent border, soft inner glow).
- [ ] Build custom-styled `<select>` dropdowns for **Location** and **Cuisine** with animated chevron indicators.
- [ ] Build a pill-style toggle group for **Budget** (Low / Medium / High) replacing plain radio buttons.
- [ ] Add a multi-line `<textarea>` for custom preferences with a character counter and focus ring animation.
- [ ] Include a gradient "Find Restaurants" CTA button with a shimmer hover effect and press animation.

#### Phase F4: Results Display & Card Design
- [ ] Create a premium restaurant result card component with:
  - Restaurant name (large heading), cuisine tags, and star-rating display.
  - AI-generated "Why we recommend this" snippet in a styled blockquote.
  - Cost indicator (₹ / ₹₹ / ₹₹₹) and online order / table booking badges.
  - Subtle border gradient and card lift (`transform: translateY`) on hover.
- [ ] Add a skeleton loading state (animated shimmer placeholders) shown while the API call is in-flight.
- [ ] Implement a "No results found" empty state with an icon and a helpful suggestion prompt.
- [ ] Add staggered fade-in animation for cards appearing after API response.

#### Phase F5: Interactivity, Polish & Accessibility
- [ ] Wire `app.js` to handle form submission, call `/api/recommendations`, and dynamically render result cards.
- [ ] Add a page-level loading overlay / progress indicator for slow network conditions.
- [ ] Implement toast notifications for API errors (e.g., "Could not reach the server. Please try again.").
- [ ] Ensure full keyboard navigation and ARIA labels on all interactive elements.
- [ ] Validate responsive behaviour on mobile (≤480px), tablet (≤768px), and desktop viewports.
- [ ] Run Lighthouse audit and target ≥90 scores for Performance, Accessibility, and Best Practices.

---

## Verification Plan

### Automated Tests
- Script tests verifying database retrieval results for known location/cuisine queries.
- Integration tests targeting the Express recommendation API with mocked Groq responses.

### Manual Verification
- Launch server (`node src/server.js`) and open public client.
- Test edge-case inputs (e.g., extremely high rating requirements with low budget) to ensure zero-match handles gracefully.
