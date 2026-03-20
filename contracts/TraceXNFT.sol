// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChainNFT
 * @dev Main ERC-721 contract for product NFTs in the supply chain
 * Each product is represented as a unique NFT with immutable checkpoint history
 */
contract SupplyChainNFT is ERC721, ERC721URIStorage, AccessControl {

    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Supply chain stages
    enum Stage {
        Created,
        Manufactured,
        InDistribution,
        InRetail,
        Sold
    }

    // Checkpoint data structure
    struct Checkpoint {
        string productId;
        string batchNumber;
        uint256 timestamp;
        string location;
        Stage stage;
        address handler;
        string notes;
    }

    // Product data structure
    struct Product {
        string productId;
        string batchNumber;
        uint256 manufacturingDate;
        Stage currentStage;
        address currentOwner;
        bool exists;
    }

    uint256 private _tokenIdCounter;
    
    // Mappings
    mapping(uint256 => Product) public products;
    mapping(uint256 => Checkpoint[]) public productCheckpoints;
    mapping(string => uint256) public productIdToTokenId;
    
    // Events
    event ProductMinted(
        uint256 indexed tokenId,
        string productId,
        string batchNumber,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event CheckpointAdded(
        uint256 indexed tokenId,
        Stage stage,
        string location,
        address indexed handler,
        uint256 timestamp
    );
    
    event ProductTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        Stage newStage,
        uint256 timestamp
    );
    
    event RoleGrantedToUser(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    event TransferredToDistributor(uint256 indexed tokenId, address indexed distributor);
    event TransferredToRetailer(uint256 indexed tokenId, address indexed retailer);
    event ProductSold(uint256 indexed tokenId);

    constructor() ERC721("SupplyChainProduct", "SCP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Mint a new product NFT (only manufacturers can call this)
     */
    function mintProduct(
        string memory productId,
        string memory batchNumber,
        string memory tokenURI,
        string memory notes
    ) public onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(productIdToTokenId[productId] == 0, "Product ID already exists");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        products[tokenId] = Product({
            productId: productId,
            batchNumber: batchNumber,
            manufacturingDate: block.timestamp,
            currentStage: Stage.Manufactured,
            currentOwner: msg.sender,
            exists: true
        });
        
        productIdToTokenId[productId] = tokenId;
        
        // Add manufacturing checkpoint
        productCheckpoints[tokenId].push(Checkpoint({
            productId: productId,
            batchNumber: batchNumber,
            timestamp: block.timestamp,
            location: "",
            stage: Stage.Manufactured,
            handler: msg.sender,
            notes: notes
        }));
        
        emit ProductMinted(tokenId, productId, batchNumber, msg.sender, block.timestamp);
        emit CheckpointAdded(tokenId, Stage.Manufactured, "", msg.sender, block.timestamp);
        
        return tokenId;
    }

    /**
     * @dev Transfer product to distributor (only manufacturer can call)
     */
    function transferToDistributor(
        uint256 tokenId,
        address distributor,
        string memory location,
        string memory notes
    ) public onlyRole(MANUFACTURER_ROLE) {
        require(products[tokenId].exists, "Product does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(products[tokenId].currentStage == Stage.Manufactured, "Invalid stage");
        require(hasRole(DISTRIBUTOR_ROLE, distributor), "Recipient is not a distributor");
        
        _transfer(msg.sender, distributor, tokenId);
        
        products[tokenId].currentStage = Stage.InDistribution;
        products[tokenId].currentOwner = distributor;
        
        productCheckpoints[tokenId].push(Checkpoint({
            productId: products[tokenId].productId,
            batchNumber: products[tokenId].batchNumber,
            timestamp: block.timestamp,
            location: location,
            stage: Stage.InDistribution,
            handler: distributor,
            notes: notes
        }));
        
        emit ProductTransferred(tokenId, msg.sender, distributor, Stage.InDistribution, block.timestamp);
        emit CheckpointAdded(tokenId, Stage.InDistribution, location, distributor, block.timestamp);
    }

    /**
     * @dev Transfer product to retailer (only distributor can call)
     */
    function transferToRetailer(
        uint256 tokenId,
        address retailer,
        string memory location,
        string memory notes
    ) public onlyRole(DISTRIBUTOR_ROLE) {
        require(products[tokenId].exists, "Product does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(products[tokenId].currentStage == Stage.InDistribution, "Invalid stage");
        require(hasRole(RETAILER_ROLE, retailer), "Recipient is not a retailer");
        
        _transfer(msg.sender, retailer, tokenId);
        
        products[tokenId].currentStage = Stage.InRetail;
        products[tokenId].currentOwner = retailer;
        
        productCheckpoints[tokenId].push(Checkpoint({
            productId: products[tokenId].productId,
            batchNumber: products[tokenId].batchNumber,
            timestamp: block.timestamp,
            location: location,
            stage: Stage.InRetail,
            handler: retailer,
            notes: notes
        }));
        
        emit ProductTransferred(tokenId, msg.sender, retailer, Stage.InRetail, block.timestamp);
        emit CheckpointAdded(tokenId, Stage.InRetail, location, retailer, block.timestamp);
    }

    /**
     * @dev Sell product to consumer (only retailer can call)
     */
    function sellToConsumer(
        uint256 tokenId,
        address consumer,
        string memory location,
        string memory notes
    ) public onlyRole(RETAILER_ROLE) {
        require(products[tokenId].exists, "Product does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(products[tokenId].currentStage == Stage.InRetail, "Invalid stage");
        
        _transfer(msg.sender, consumer, tokenId);
        
        products[tokenId].currentStage = Stage.Sold;
        products[tokenId].currentOwner = consumer;
        
        productCheckpoints[tokenId].push(Checkpoint({
            productId: products[tokenId].productId,
            batchNumber: products[tokenId].batchNumber,
            timestamp: block.timestamp,
            location: location,
            stage: Stage.Sold,
            handler: consumer,
            notes: notes
        }));
        
        emit ProductTransferred(tokenId, msg.sender, consumer, Stage.Sold, block.timestamp);
        emit CheckpointAdded(tokenId, Stage.Sold, location, consumer, block.timestamp);
    }

    /**
     * @dev Transfer product to distributor (Strict Lifecycle)
     */
    function transferToDistributor(uint256 tokenId, address distributor) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(hasRole(DISTRIBUTOR_ROLE, distributor), "Recipient is not a distributor");
        
        _transfer(msg.sender, distributor, tokenId);
        
        products[tokenId].currentStage = Stage.InDistribution;
        products[tokenId].currentOwner = distributor;
        
        emit TransferredToDistributor(tokenId, distributor);
    }

    /**
     * @dev Transfer product to retailer (Strict Lifecycle)
     */
    function transferToRetailer(uint256 tokenId, address retailer) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(hasRole(RETAILER_ROLE, retailer), "Recipient is not a retailer");
        
        _transfer(msg.sender, retailer, tokenId);
        
        products[tokenId].currentStage = Stage.InRetail;
        products[tokenId].currentOwner = retailer;
        
        emit TransferredToRetailer(tokenId, retailer);
    }

    /**
     * @dev Mark product as sold (Strict Lifecycle)
     */
    function markAsSold(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        
        products[tokenId].currentStage = Stage.Sold;
        
        emit ProductSold(tokenId);
    }

    /**
     * @dev Get product history based on caller's role
     * Role-based visibility: each role can only see history up to their stage
     */
    function getProductHistory(uint256 tokenId) public view returns (Checkpoint[] memory) {
        require(products[tokenId].exists, "Product does not exist");
        
        Checkpoint[] memory allCheckpoints = productCheckpoints[tokenId];
        uint256 visibleCount = 0;
        
        // Determine how many checkpoints are visible based on role
        if (hasRole(ADMIN_ROLE, msg.sender) || ownerOf(tokenId) == msg.sender) {
            // Admin or current owner sees everything
            return allCheckpoints;
        } else if (hasRole(RETAILER_ROLE, msg.sender)) {
            // Retailer sees up to retail stage
            for (uint i = 0; i < allCheckpoints.length; i++) {
                if (allCheckpoints[i].stage <= Stage.InRetail) {
                    visibleCount++;
                }
            }
        } else if (hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
            // Distributor sees up to distribution stage
            for (uint i = 0; i < allCheckpoints.length; i++) {
                if (allCheckpoints[i].stage <= Stage.InDistribution) {
                    visibleCount++;
                }
            }
        } else if (hasRole(MANUFACTURER_ROLE, msg.sender)) {
            // Manufacturer sees only manufacturing stage
            for (uint i = 0; i < allCheckpoints.length; i++) {
                if (allCheckpoints[i].stage == Stage.Manufactured) {
                    visibleCount++;
                }
            }
        } else {
            // Consumer who owns the product sees full history
            if (products[tokenId].currentStage == Stage.Sold) {
                return allCheckpoints;
            }
            // Non-owner consumers see nothing
            visibleCount = 0;
        }
        
        Checkpoint[] memory visibleCheckpoints = new Checkpoint[](visibleCount);
        uint256 index = 0;
        
        for (uint i = 0; i < allCheckpoints.length && index < visibleCount; i++) {
            bool isVisible = false;
            
            if (hasRole(RETAILER_ROLE, msg.sender) && allCheckpoints[i].stage <= Stage.InRetail) {
                isVisible = true;
            } else if (hasRole(DISTRIBUTOR_ROLE, msg.sender) && allCheckpoints[i].stage <= Stage.InDistribution) {
                isVisible = true;
            } else if (hasRole(MANUFACTURER_ROLE, msg.sender) && allCheckpoints[i].stage == Stage.Manufactured) {
                isVisible = true;
            }
            
            if (isVisible) {
                visibleCheckpoints[index] = allCheckpoints[i];
                index++;
            }
        }
        
        return visibleCheckpoints;
    }

    /**
     * @dev Get full product history (for verified consumers who purchased)
     */
    function getFullProductHistory(uint256 tokenId) public view returns (Checkpoint[] memory) {
        require(products[tokenId].exists, "Product does not exist");
        require(
            ownerOf(tokenId) == msg.sender || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to view full history"
        );
        
        return productCheckpoints[tokenId];
    }

    /**
     * @dev Get product details
     */
    function getProduct(uint256 tokenId) public view returns (Product memory) {
        require(products[tokenId].exists, "Product does not exist");
        return products[tokenId];
    }

    /**
     * @dev Get token ID by product ID
     */
    function getTokenIdByProductId(string memory productId) public view returns (uint256) {
        uint256 tokenId = productIdToTokenId[productId];
        require(tokenId != 0, "Product not found");
        return tokenId;
    }

    /**
     * @dev Get total number of checkpoints for a product
     */
    function getCheckpointCount(uint256 tokenId) public view returns (uint256) {
        require(products[tokenId].exists, "Product does not exist");
        return productCheckpoints[tokenId].length;
    }

    /**
     * @dev Grant role to an address (admin only)
     */
    function assignRole(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        grantRole(role, account);
        emit RoleGrantedToUser(role, account, msg.sender);
    }

    /**
     * @dev Check if address has a specific role
     */
    function checkRole(bytes32 role, address account) public view returns (bool) {
        return hasRole(role, account);
    }

    /**
     * @dev Get user's role (returns first matching role)
     */
    function getUserRole(address account) public view returns (string memory) {
        if (hasRole(ADMIN_ROLE, account)) return "ADMIN";
        if (hasRole(MANUFACTURER_ROLE, account)) return "MANUFACTURER";
        if (hasRole(DISTRIBUTOR_ROLE, account)) return "DISTRIBUTOR";
        if (hasRole(RETAILER_ROLE, account)) return "RETAILER";
        return "CONSUMER";
    }

    /**
     * @dev Get all user's roles (returns comma-separated list)
     */
    function getUserRoles(address account) public view returns (string memory) {
        string memory roles = "";
        bool first = true;
        
        if (hasRole(ADMIN_ROLE, account)) {
            roles = "ADMIN";
            first = false;
        }
        if (hasRole(MANUFACTURER_ROLE, account)) {
            roles = first ? "MANUFACTURER" : string.concat(roles, ",MANUFACTURER");
            first = false;
        }
        if (hasRole(DISTRIBUTOR_ROLE, account)) {
            roles = first ? "DISTRIBUTOR" : string.concat(roles, ",DISTRIBUTOR");
            first = false;
        }
        if (hasRole(RETAILER_ROLE, account)) {
            roles = first ? "RETAILER" : string.concat(roles, ",RETAILER");
            first = false;
        }
        
        return bytes(roles).length > 0 ? roles : "CONSUMER";
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
