# Project Roadmap

## Phase 1: Product Ownership Lifecycle Data Model
**Status**: ✅ Complete
**Objective:** Refactor the Database Schemas (`Product.js` and `User.js`), update the seed script (`seed.js`) with medical products, and enforce rigid supply-chain ownership transfer without stage skipping.

**Deliverables:**
1. Updated `User` model (ensure walletAddress is required/managed).
2. Updated `Product` model (explicit `_id` and role bindings).
3. Update `seed.js` for new schema and medical product seed data.
4. Update Backend API routes and Frontend Dashboard calls for the new schema logic.
