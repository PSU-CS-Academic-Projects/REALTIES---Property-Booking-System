# Realties — Property Booking Web App

A front-end web application for browsing, saving, and booking property viewings — built with vanilla HTML, CSS, and JavaScript. Realties simulates a luxury real estate platform for the Philippine market, letting users log in, explore listings, save favorites, and schedule property viewings or virtual tours.

## Project Description

Realties is a single-page application (SPA) that demonstrates a full front-end workflow for a real estate booking platform. After logging in with demo credentials, users land on a personalized dashboard showing key stats (available listings, bookings, saved properties). From there they can browse a searchable, filterable property catalog, view detailed listing information in a modal, and book an in-person viewing or virtual tour for an available date. All data — users, properties, and bookings — is loaded from a local `data.json` file and managed entirely in-browser using JavaScript state, with no backend server or database required.

## Feature List

- **User Authentication** — Login screen with demo credentials, including basic validation and error feedback.
- **Dashboard Overview** — At-a-glance stats (available listings, active bookings, saved properties, average sale price) plus featured properties and upcoming viewings.
- **Property Listings** — Responsive grid of property cards with images, price, type, and status (For Sale / For Rent).
- **Search & Filter** — Live search by title, address, or type, plus quick filter buttons (All, For Sale, For Rent, House & Lot, Penthouse, Villa, Loft & Studio).
- **Property Detail Modal** — Full property view with specs (beds, baths, sqm, floor, year built), description, features list, and listing agent contact info.
- **Booking System** — Select an available date and booking type (In-Person Viewing or Virtual Tour), with duplicate-booking prevention and toast notifications.
- **Saved Properties (Wishlist)** — Save/unsave properties for later, with a live count badge in the sidebar.
- **My Bookings Page** — View all scheduled bookings with status (Confirmed/Pending).
- **Fallback Data Handling** — If `data.json` fails to load (e.g. opened directly as a file), the app falls back to inline sample data so it still works.

## Installation Guide

This is a static front-end project — no build tools, frameworks, or dependencies required.

### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, etc.)
- (Recommended) A simple local web server, since the app fetches `data.json` via `fetch()`, which some browsers block on `file://` URLs.

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-org-or-username>/<repo-name>.git
   cd <repo-name>
   ```

2. **Run a local server** (recommended)

   Using Python:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

   Using VS Code: install the **Live Server** extension and click "Go Live".

   Alternatively, you can simply double-click `index.html` to open it directly in your browser — the app includes fallback data in case `data.json` can't be fetched this way.

3. **Log in with demo credentials**
   - Email: `alex@demo.com`
   - Password: `demo123`

   (A second demo account is also available: `marcus@demo.com` / `demo123`)

## Members / Contributors
- Efren Johannes Bucao
- John Christopher Remandaban
- Christian Palanca

## Academic Year

> 2025 - 2026

## Subject

> SYSTEM INTEGRATION ARCHITECTURE

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- JSON (local data source, no backend/database)
