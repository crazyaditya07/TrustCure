// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// ============================================================
// PHASE 1 — STORAGE ARCHITECTURE (No logic implemented yet)
// ============================================================
//
// This file defines the foundational data layer for the TraceX
// pharmaceutical supply chain tracking system.
//
// INVARIANTS (all enforced in later phases):
//   I-01: Stage transitions are strictly monotonic.
//   I-02: ownerOf(tokenId) is the single source of custody truth.
//   I-03: Sold stage is terminal and halts all further state changes.
//   I-04: msg.sender must be owner AND hold the correct role to transfer.
// ============================================================

contract TraceXSupplyChain is ERC721URIStorage, AccessControl {

    // ─────────────────────────────────────────────────────────
    // SECTION 1: Role Identifiers
    // ─────────────────────────────────────────────────────────
    // Three operational roles in the supply chain.
    // Admin (DEFAULT_ADMIN_ROLE) governs role assignments.
    // Mint authority is restricted to MANUFACTURER_ROLE.

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE  = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE     = keccak256("RETAILER_ROLE");

    // ─────────────────────────────────────────────────────────
    // SECTION 2: Enumerations
    // ─────────────────────────────────────────────────────────
    // Stage: strictly ordered. The uint8 cast of the next stage
    // must equal (current stage + 1). This is the monotonicity
    // invariant enforced in Phase 3.
    //
    // RoleType: serialised role snapshot. Stored in each
    // Checkpoint so history remains verifiable even after
    // on-chain role revocations.

    enum Stage {
        Manufactured,   // 0 — genesis state
        InDistribution, // 1
        InRetail,       // 2
        Sold            // 3 — terminal / frozen
    }

    enum RoleType {
        Manufacturer, // 0
        Distributor,  // 1
        Retailer,     // 2
        Consumer,     // 3 — recipient at Sold stage
        None          // 4 — fallback / unregistered
    }

    // ─────────────────────────────────────────────────────────
    // SECTION 3: Structs
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Checkpoint — one immutable record per custody event.
     *
     * Gas notes:
     *   - `roleSnapshot` is uint8-sized via the enum — no wasted slot.
     *   - `stage` packed alongside `roleSnapshot` in the same 32-byte slot
     *     if the compiler chooses tight packing (struct ordering matters).
     *   - `locationHash` is bytes32 — cheaper than a string.
     *   - No mapping keys inside the struct (avoid nested storage pointers).
     */
    struct Checkpoint {
        address  handler;       // Custodian wallet at transfer time
        RoleType roleSnapshot;  // Serialised role — immutable after append
        Stage    stage;         // Lifecycle index when this checkpoint was set
        uint256  timestamp;     // block.timestamp at time of recording
        bytes32  locationHash;  // keccak256 of location string — oracle-ready
    }

    /**
     * @notice ProductMeta — current lifecycle state per token.
     *
     * Gas notes:
     *   - `stage` and `isLocked` can share one 32-byte slot with padding.
     *   - `physicalIdHash` caches the deduplication key so the registry
     *     mapping can clean up without re-hashing.
     */
    struct ProductMeta {
        Stage    currentStage;   // Monotonically advancing state index
        bool     isLocked;       // Set true when stage reaches Sold
        bytes32  physicalIdHash; // Hash of the physical product ID at mint
    }

    // ─────────────────────────────────────────────────────────
    // SECTION 4: Storage Mappings
    // ─────────────────────────────────────────────────────────

    /// @dev Append-only custody trail. Key = tokenId.
    /// No setter function may ever overwrite or delete an element.
    mapping(uint256 => Checkpoint[]) private _provenance;

    /// @dev Current lifecycle state for each minted token.
    mapping(uint256 => ProductMeta) private _metadata;

    /// @dev Deduplication guard. Maps hash of physical product ID to tokenId.
    /// A non-zero value means the product is already on-chain.
    mapping(bytes32 => uint256) private _genesisRegistry;

    /// @dev Monotonically incrementing token counter.
    /// Starts at 1 so that _genesisRegistry zero-value checks remain valid.
    uint256 private _nextTokenId;

    // ─────────────────────────────────────────────────────────
    // SECTION 5: Events (skeleton — bodies added in later phases)
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a new pharmaceutical product is minted.
     * @param tokenId     On-chain NFT identifier.
     * @param physicalId  Human-readable product / batch ID.
     * @param manufacturer Wallet of the minting entity.
     * @param timestamp   Block time of genesis.
     */
    event ProductGenesis(
        uint256 indexed tokenId,
        string          physicalId,
        address indexed manufacturer,
        uint256         timestamp
    );

    /**
     * @notice Emitted on every successful custody transfer through the lifecycle.
     * Indexed fields allow efficient event log querying for analytics/recall dashboards.
     *
     * @param tokenId   Token being transferred.
     * @param from      Previous custodian.
     * @param to        New custodian.
     * @param stage     New lifecycle stage after transfer.
     * @param timestamp Block time of the transfer.
     */
    event LifecycleTransition(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        Stage           stage,
        uint256         timestamp
    );

    // ─────────────────────────────────────────────────────────
    // SECTION 6: Constructor
    // ─────────────────────────────────────────────────────────

    constructor() ERC721("TraceXProduct", "TXP") {
        // Deployer receives admin authority.
        // Admin is the only account that can grant MANUFACTURER_ROLE,
        // DISTRIBUTOR_ROLE, and RETAILER_ROLE.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Token IDs begin at 1 (zero is reserved as a null sentinel).
        _nextTokenId = 1;
    }

    // ─────────────────────────────────────────────────────────
    // SECTION 7: Required Interface Overrides
    // ─────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ═════════════════════════════════════════════════════════
    // PHASE 2 — SAFE MINT + GENESIS PROVENANCE ENGINE
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Mint a new pharmaceutical product NFT and record its genesis provenance.
     *
     * Security model:
     *   • Only an account holding MANUFACTURER_ROLE may call this.
     *   • The physical product ID is hashed and stored in _genesisRegistry.
     *     If the same hash already maps to a non-zero tokenId, the call
     *     reverts. This prevents a rogue actor from legitimising a counterfeit
     *     by minting a second token for the same physical item.
     *   • Genesis checkpoint is appended *before* _safeMint to ensure the
     *     provenance record is always created atomically with the token.
     *     If _safeMint reverts (e.g. ERC721Receiver rejection), the whole
     *     transaction rolls back — no orphaned checkpoints can exist.
     *
     * Mint abuse considerations:
     *   • Role assignment is admin-controlled (DEFAULT_ADMIN_ROLE).
     *   • A compromised manufacturer key can only mint products under its own
     *     physicalId namespace — it cannot overwrite another manufacturer's
     *     existing records because _genesisRegistry blocks re-registration.
     *   • Future extension: add a Pausable guard or per-manufacturer mint
     *     quotas via a mapping(address => uint256) to limit blast radius.
     *
     * @param physicalId    Human-readable identifier (e.g. batch number, serial).
     * @param tokenURIData  IPFS/Arweave URI for product metadata JSON.
     * @param locationHash  keccak256 of the manufacturing site descriptor.
     *                      Treated as a self-reported signal, not verified truth.
     *
     * @return tokenId      The newly assigned on-chain token identifier.
     */
    function mintProduct(
        string  calldata physicalId,
        string  calldata tokenURIData,
        bytes32          locationHash
    )
        external
        onlyRole(MANUFACTURER_ROLE)
        returns (uint256 tokenId)
    {
        // ── 1. Deduplication Guard ──────────────────────────────
        // Hash the physical ID to produce a fixed-size key.
        bytes32 idHash = keccak256(abi.encodePacked(physicalId));

        // A non-zero value means this product already exists on-chain.
        // This prevents counterfeit legitimisation via duplicate minting.
        require(
            _genesisRegistry[idHash] == 0,
            "TraceX: product already registered"
        );

        // ── 2. Token ID Assignment ──────────────────────────────
        // Assign and immediately increment. _nextTokenId starts at 1,
        // so zero can never be a valid returned tokenId.
        tokenId = _nextTokenId;
        unchecked { _nextTokenId++; } // overflow unreachable in practice

        // ── 3. Register Deduplication Key ──────────────────────
        // Written before mint so re-entrancy via onERC721Received cannot
        // re-enter mintProduct and sneak in a second token for the same ID.
        _genesisRegistry[idHash] = tokenId;

        // ── 4. Initialise Product Metadata ─────────────────────
        _metadata[tokenId] = ProductMeta({
            currentStage:   Stage.Manufactured,
            isLocked:       false,
            physicalIdHash: idHash
        });

        // ── 5. Genesis Checkpoint ──────────────────────────────
        // Every product MUST have an origin record.
        // roleSnapshot is Manufacturer — the only role that can call this.
        _provenance[tokenId].push(Checkpoint({
            handler:      msg.sender,
            roleSnapshot: RoleType.Manufacturer,
            stage:        Stage.Manufactured,
            timestamp:    block.timestamp,
            locationHash: locationHash
        }));

        // ── 6. Mint the NFT ────────────────────────────────────
        // _safeMint will call onERC721Received on contract recipients.
        // All state above is committed first; any revert here rolls
        // everything back atomically — no partial state persistence.
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURIData);

        // ── 7. Emit Genesis Event ──────────────────────────────
        emit ProductGenesis(tokenId, physicalId, msg.sender, block.timestamp);

        return tokenId;
    }

    // ─────────────────────────────────────────────────────────
    // PHASE 2 ENDS HERE.
    // ─────────────────────────────────────────────────────────

    // ═════════════════════════════════════════════════════════
    // PHASE 3 — GUARDED CUSTODY TRANSFER STATE MACHINE
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Custom errors — cheaper than require(false, "string").
     * Each error uniquely identifies the rejection reason for off-chain
     * error decoding and audit logging.
     */
    error TraceX__NotTokenOwner(uint256 tokenId, address caller);
    error TraceX__ProductFrozen(uint256 tokenId);
    error TraceX__WrongSenderRole(uint256 tokenId, Stage currentStage);
    error TraceX__WrongRecipientRole(uint256 tokenId, Stage nextStage, address recipient);
    error TraceX__ProductNotFound(uint256 tokenId);

    /**
     * @notice Transfer custody of a product to the next participant in the supply chain.
     *
     * STATE TRANSITION INVARIANTS:
     *   I-01 Monotonicity:    nextStage == currentStage + 1. No skipping. No reversal.
     *   I-02 Ownership:       msg.sender must be the ERC721 owner at call time.
     *   I-03 Terminal Guard:  If isLocked == true (Sold), always revert first.
     *   I-04 Sender Role:     Manufacturer sends from Manufactured,
     *                         Distributor sends from InDistribution,
     *                         Retailer sends from InRetail.
     *   I-05 Recipient Role:  Distributor receives at InDistribution,
     *                         Retailer receives at InRetail,
     *                         Consumer (any address) receives at Sold.
     *
     * ATOMICITY GUARANTEE:
     *   All five mutations below — (1) stage update, (2) isLocked flag,
     *   (3) checkpoint append, (4) NFT transfer, (5) event emission — execute
     *   inside a single transaction. If any step reverts, the EVM rolls back
     *   all preceding state writes. There is no partial state possible.
     *
     * DUPLICATE TRANSFER PREVENTION:
     *   Because `_metadata[tokenId].currentStage` is updated before the NFT
     *   transfer, any concurrent or replayed call with the same arguments will
     *   find a different currentStage and fail the monotonicity check.
     *
     * @param tokenId       The on-chain token ID of the product.
     * @param recipient     Next custodian's wallet address.
     * @param locationHash  keccak256 of the handoff location descriptor.
     */
    function transferCustody(
        uint256 tokenId,
        address recipient,
        bytes32 locationHash
    ) external {

        // ── Guard 0: Existence ──────────────────────────────────
        // _metadata is only populated in mintProduct; an un-minted tokenId
        // will have isLocked == false and currentStage == 0 (Manufactured),
        // which could allow a ghost transfer. The physicalIdHash field being
        // zero is the reliable sentinel — use that.
        ProductMeta storage meta = _metadata[tokenId];
        if (meta.physicalIdHash == bytes32(0)) {
            revert TraceX__ProductNotFound(tokenId);
        }

        // ── Guard 1: Terminal State ─────────────────────────────
        // Must be checked BEFORE the ownership and role guards.
        // A frozen product must be unconditionally immovable, regardless
        // of who is calling or what role they hold.
        if (meta.isLocked) {
            revert TraceX__ProductFrozen(tokenId);
        }

        // ── Guard 2: Custody (I-02) ─────────────────────────────
        // ERC721 ownerOf is the authoritative source of truth.
        // This also implicitly guarantees the token exists (ownerOf reverts
        // on unminted tokens), providing a second existence safety net.
        if (ownerOf(tokenId) != msg.sender) {
            revert TraceX__NotTokenOwner(tokenId, msg.sender);
        }

        // ── Guard 3: Sender Role + Stage Snapshot (I-04) ────────
        // Capture stage before any writes to prevent TOCTOU issues.
        Stage current = meta.currentStage;

        // Map current stage -> required sender role, and capture the
        // RoleType snapshot that will be stored in the checkpoint.
        // This snapshot is taken NOW — not after role assignment changes.
        RoleType senderRoleSnapshot;

        if (current == Stage.Manufactured) {
            if (!hasRole(MANUFACTURER_ROLE, msg.sender))
                revert TraceX__WrongSenderRole(tokenId, current);
            senderRoleSnapshot = RoleType.Manufacturer;

        } else if (current == Stage.InDistribution) {
            if (!hasRole(DISTRIBUTOR_ROLE, msg.sender))
                revert TraceX__WrongSenderRole(tokenId, current);
            senderRoleSnapshot = RoleType.Distributor;

        } else if (current == Stage.InRetail) {
            if (!hasRole(RETAILER_ROLE, msg.sender))
                revert TraceX__WrongSenderRole(tokenId, current);
            senderRoleSnapshot = RoleType.Retailer;

        } else {
            // Sold stage is caught by isLocked above, but as a safety net:
            revert TraceX__ProductFrozen(tokenId);
        }

        // ── Compute Next Stage (I-01) ────────────────────────────
        // uint8 cast is safe: Stage has 4 values (0–3).
        // We already know current < Sold from the guard above.
        Stage next = Stage(uint8(current) + 1);

        // ── Guard 4: Recipient Role (I-05) ──────────────────────
        // Consumer stage has no on-chain role requirement — any address
        // can receive a product (they are the end patient/customer).
        if (next == Stage.InDistribution) {
            if (!hasRole(DISTRIBUTOR_ROLE, recipient))
                revert TraceX__WrongRecipientRole(tokenId, next, recipient);

        } else if (next == Stage.InRetail) {
            if (!hasRole(RETAILER_ROLE, recipient))
                revert TraceX__WrongRecipientRole(tokenId, next, recipient);
        }
        // next == Stage.Sold: markAsSold() handles this — no transferCustody to consumer.

        // ══════════════════════════════════════════════════════
        // ATOMIC STATE MUTATION — No early returns below this line.
        // All five steps must succeed or the entire tx reverts.
        // ══════════════════════════════════════════════════════

        // ── Mutation 1: Advance Stage ────────────────────────────
        meta.currentStage = next;

        // ── Mutation 2: Terminal Freeze ──────────────────────────
        // Freeze immediately on reaching Sold so any re-entrancy attempt
        // via onERC721Received is blocked by Guard 1 on re-entry.
        if (next == Stage.Sold) {
            meta.isLocked = true;
        }

        // ── Mutation 3: Append Immutable Checkpoint ──────────────
        // roleSnapshot records sender's role AT THIS MOMENT.
        // If the sender's role is later revoked, the record still shows
        // they were authorised at handoff time — historical integrity intact.
        _provenance[tokenId].push(Checkpoint({
            handler:      msg.sender,
            roleSnapshot: senderRoleSnapshot,
            stage:        next,
            timestamp:    block.timestamp,
            locationHash: locationHash
        }));

        // ── Mutation 4: NFT Ownership Transfer ──────────────────
        // Internal _transfer bypasses approval checks. Phase 4 will
        // override the public-facing transferFrom / safeTransferFrom to
        // revert, ensuring this is the ONLY path that moves the token.
        _transfer(msg.sender, recipient, tokenId);

        // ── Mutation 5: Emit Lifecycle Event ────────────────────
        emit LifecycleTransition(tokenId, msg.sender, recipient, next, block.timestamp);
    }

    /**
     * @notice Mark a product as sold without transferring NFT ownership.
     *
     * Called by a RETAILER_ROLE holder who is the current on-chain owner of the token.
     * The product stage advances to Sold and is permanently locked (isLocked = true).
     * Ownership of the NFT remains with the retailer — no consumer wallet is needed.
     *
     * This is the terminal action in the supply chain. After this call:
     *   • The product cannot be transferred (Phase 4 lockdown + isLocked guard).
     *   • The stage is permanently Sold.
     *   • A final immutable checkpoint is appended with RoleType.Retailer.
     *
     * @param tokenId  The on-chain token ID of the product to mark as sold.
     */
    function markAsSold(uint256 tokenId) external {

        // ── Guard 0: Existence ──────────────────────────────────
        ProductMeta storage meta = _metadata[tokenId];
        if (meta.physicalIdHash == bytes32(0)) {
            revert TraceX__ProductNotFound(tokenId);
        }

        // ── Guard 1: Terminal State ─────────────────────────────
        if (meta.isLocked) {
            revert TraceX__ProductFrozen(tokenId);
        }

        // ── Guard 2: Custody ────────────────────────────────────
        if (ownerOf(tokenId) != msg.sender) {
            revert TraceX__NotTokenOwner(tokenId, msg.sender);
        }

        // ── Guard 3: Sender Must Be Retailer at InRetail Stage ──
        if (meta.currentStage != Stage.InRetail) {
            revert TraceX__WrongSenderRole(tokenId, meta.currentStage);
        }
        if (!hasRole(RETAILER_ROLE, msg.sender)) {
            revert TraceX__WrongSenderRole(tokenId, meta.currentStage);
        }

        // ══════════════════════════════════════════════════════
        // ATOMIC STATE MUTATION
        // ══════════════════════════════════════════════════════

        // ── Mutation 1: Advance Stage to Sold ───────────────────
        meta.currentStage = Stage.Sold;

        // ── Mutation 2: Lock the Product ─────────────────────────
        meta.isLocked = true;

        // ── Mutation 3: Append Final Checkpoint ──────────────────
        // handler = retailer wallet (msg.sender). No consumer address stored.
        _provenance[tokenId].push(Checkpoint({
            handler:      msg.sender,
            roleSnapshot: RoleType.Retailer,
            stage:        Stage.Sold,
            timestamp:    block.timestamp,
            locationHash: bytes32(0) // No location required for point-of-sale
        }));

        // ── Mutation 4: Emit Lifecycle Event ─────────────────────
        // `to` is address(0) to signal no ownership transfer occurred.
        emit LifecycleTransition(tokenId, msg.sender, address(0), Stage.Sold, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────
    // PHASE 3 ENDS HERE.
    // ─────────────────────────────────────────────────────────

    // ═════════════════════════════════════════════════════════
    // PHASE 4 — ERC721 TRANSFER LOCKDOWN
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Error thrown when a standard ERC721 transfer or approval is attempted.
     * All custody movement must go through transferCustody().
     */
    error TraceX__TransferLocked();

    /**
     * @dev Overridden to prevent uncontrolled transfers.
     * All custody changes must pass through transferCustody() to ensure
     * that stage updates and provenance recording occur atomically.
     */
    function transferFrom(address, address, uint256) public virtual override(ERC721, IERC721) {
        revert TraceX__TransferLocked();
    }

    /**
     * @dev Overridden to prevent uncontrolled transfers.
     */
    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override(ERC721, IERC721) {
        revert TraceX__TransferLocked();
    }

    /**
     * @dev Overridden to prevent uncontrolled transfers.
     */
    function approve(address, uint256) public virtual override(ERC721, IERC721) {
        revert TraceX__TransferLocked();
    }

    /**
     * @dev Overridden to prevent uncontrolled transfers.
     */
    function setApprovalForAll(address, bool) public virtual override(ERC721, IERC721) {
        revert TraceX__TransferLocked();
    }

    // ─────────────────────────────────────────────────────────
    // PHASE 4 ENDS HERE.
    // ─────────────────────────────────────────────────────────

    // ═════════════════════════════════════════════════════════
    // PHASE 5 — PUBLIC VERIFICATION READ LAYER
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Retrieve the complete provenance history of a product.
     *
     * Memory Safety & Scalability:
     *   • This is a `view` function intended for off-chain execution via RPC.
     *   • It returns the entire Checkpoint array. For extremely long supply
     *     chains (e.g., hundreds of handlers), this could exceed the
     *     response size limits of some RPC providers.
     *   • Future optimization: implementing index-based pagination
     *     (e.g., getProvenance(tokenId, offset, limit)).
     *
     * @param tokenId  The on-chain token identifier.
     * @return history An ordered array of immutable Checkpoints.
     */
    function getProvenance(uint256 tokenId)
        external
        view
        returns (Checkpoint[] memory history)
    {
        if (_metadata[tokenId].physicalIdHash == bytes32(0)) {
            revert TraceX__ProductNotFound(tokenId);
        }
        return _provenance[tokenId];
    }

    /**
     * @notice Retrieve the current metadata and lifecycle stage of a product.
     * @param tokenId The on-chain token identifier.
     * @return meta    The current ProductMeta struct (Stage, isLocked, physicalIdHash).
     */
    function getProductMeta(uint256 tokenId)
        external
        view
        returns (ProductMeta memory meta)
    {
        meta = _metadata[tokenId];
        if (meta.physicalIdHash == bytes32(0)) {
            revert TraceX__ProductNotFound(tokenId);
        }
    }

    /**
     * @notice Helper to get the total number of checkpoints recorded for a product.
     * Useful for frontend pagination or dashboard analytics.
     */
    function getCheckpointCount(uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return _provenance[tokenId].length;
    }

    /**
     * @notice Helper to convert a physicalId string to its on-chain tokenId.
     * Enables QR-based verification starting from the physical label.
     */
    function getTokenIdFromPhysicalId(string calldata physicalId)
        external
        view
        returns (uint256)
    {
        bytes32 idHash = keccak256(abi.encodePacked(physicalId));
        uint256 tokenId = _genesisRegistry[idHash];
        if (tokenId == 0) {
            revert TraceX__ProductNotFound(0); // Using 0 as surrogate for non-existent tokenId
        }
        return tokenId;
    }

    // ─────────────────────────────────────────────────────────
    // PHASE 5 ENDS HERE.
    // ─────────────────────────────────────────────────────────

    // ═════════════════════════════════════════════════════════
    // PHASE 6 — TERMINAL FREEZE ENFORCEMENT
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Checks if a product has reached the terminal 'Sold' stage and is frozen.
     * @param tokenId The on-chain token identifier.
     * @return locked True if the product is in 'Sold' stage and immobilized.
     */
    function isProductLocked(uint256 tokenId)
        external
        view
        returns (bool locked)
    {
        locked = _metadata[tokenId].isLocked;
    }

    /**
     * @notice Finalises the status of a product by confirming its terminal state.
     * This function provides a cryptographically definitive signal that the
     * product's lifecycle has concluded and its provenance is final.
     *
     * Security Reasoning:
     *   • Once 'Sold', the token is non-transferable (Phase 4 overrides).
     *   • Once 'isLocked', the stage cannot advance (Phase 3 monotonic guard).
     *   • The combination makes the 'Sold' stage a permanent dead-end.
     */
    function getFinalVerificationStatus(uint256 tokenId)
        external
        view
        returns (string memory status)
    {
        if (_metadata[tokenId].isLocked) {
            return "FINAL: Lifecycle Concluded - Provenance Frozen";
        } else {
            return "ACTIVE: Supply Chain Movement In Progress";
        }
    }

    // ─────────────────────────────────────────────────────────
    // PHASE 6 ENDS HERE.
    // Phase 7 (security review) will be concluding this implementation.
    // ─────────────────────────────────────────────────────────
}



