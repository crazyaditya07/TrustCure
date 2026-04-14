# Project Roadmap

## Phase 1: Product Ownership Lifecycle Data Model
**Status**: ✅ Complete
**Objective:** Refactor the Database Schemas (`Product.js` and `User.js`), update the seed script (`seed.js`) with medical products, and enforce rigid supply-chain ownership transfer without stage skipping.

**Deliverables:**
1. Updated `User` model (ensure walletAddress is required/managed).
2. Updated `Product` model (explicit `_id` and role bindings).
3. Update `seed.js` for new schema and medical product seed data.
4. Update Backend API routes and Frontend Dashboard calls for the new schema logic.

---

### Phase 2: Consumer Timeline UI — Human-Readable Refactor
**Status**: ✅ Complete
**Objective**: Refactor the Consumer Timeline (`ConsumerTimeline.jsx`) and the `ProductJourney.jsx` stepper tooltip to remove all wallet address display and replace with consumer-friendly, role-based actor labels and date-only timestamps.
**Depends on**: Phase 1

**Tasks**:
- [x] Remove `handlerMasked` wallet rendering from `ConsumerTimeline.jsx`
- [x] Implement `actorLabel()` helper with per-stage rules (Manufacturer shows name, Distributor/Retailer show static labels, Sold shows "Final Sale Completed")
- [x] Accept `manufacturerName` prop in `ConsumerTimeline` and forward it from `ConsumerView`
- [x] Replace `shortAddr(cp.handler)` wallet tooltip in `ProductJourney.jsx` with `stageRoleLabel()`
- [x] Update `formatTime` to date-only (`toLocaleDateString`, `month long, day, year`)
- [x] Keep Etherscan tx-hash links — de-emphasised, truncated display only

**Verification**:
- No wallet strings (`0x...`) visible in any consumer-facing UI element
- Manufactured checkpoint shows "by {manufacturerName}" or "Verified Manufacturer"
- Distributor checkpoint shows "Handled by Verified Distributor"
- Retailer checkpoint shows "Handled by Verified Retailer"
- Sold checkpoint shows "Final Sale Completed"
- Timestamps render as "April 7, 2026" format only
