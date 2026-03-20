const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Supply Chain Contracts", function () {
    let supplyChainNFT;
    let accessManager;
    let owner;
    let manufacturer;
    let distributor;
    let retailer;
    let consumer;

    const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
    const DISTRIBUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
    const RETAILER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE"));
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

    beforeEach(async function () {
        [owner, manufacturer, distributor, retailer, consumer] = await ethers.getSigners();

        // Deploy contracts
        const AccessManager = await ethers.getContractFactory("AccessManager");
        accessManager = await AccessManager.deploy();
        await accessManager.waitForDeployment();

        const SupplyChainNFT = await ethers.getContractFactory("SupplyChainNFT");
        supplyChainNFT = await SupplyChainNFT.deploy();
        await supplyChainNFT.waitForDeployment();

        // Assign roles
        await supplyChainNFT.assignRole(MANUFACTURER_ROLE, manufacturer.address);
        await supplyChainNFT.assignRole(DISTRIBUTOR_ROLE, distributor.address);
        await supplyChainNFT.assignRole(RETAILER_ROLE, retailer.address);

        await accessManager.registerParticipant(
            manufacturer.address,
            "Test Manufacturer",
            "Factory Location",
            MANUFACTURER_ROLE
        );
        await accessManager.registerParticipant(
            distributor.address,
            "Test Distributor",
            "Warehouse Location",
            DISTRIBUTOR_ROLE
        );
        await accessManager.registerParticipant(
            retailer.address,
            "Test Retailer",
            "Store Location",
            RETAILER_ROLE
        );
    });

    describe("AccessManager", function () {
        it("Should register participants correctly", async function () {
            const manufacturerInfo = await accessManager.getParticipant(manufacturer.address);
            expect(manufacturerInfo.name).to.equal("Test Manufacturer");
            expect(manufacturerInfo.isActive).to.be.true;
        });

        it("Should return correct role names", async function () {
            expect(await accessManager.getRoleName(manufacturer.address)).to.equal("MANUFACTURER");
            expect(await accessManager.getRoleName(distributor.address)).to.equal("DISTRIBUTOR");
            expect(await accessManager.getRoleName(retailer.address)).to.equal("RETAILER");
            expect(await accessManager.getRoleName(consumer.address)).to.equal("CONSUMER");
        });

        it("Should deactivate participants", async function () {
            await accessManager.deactivateParticipant(manufacturer.address);
            const info = await accessManager.getParticipant(manufacturer.address);
            expect(info.isActive).to.be.false;
        });

        it("Should prevent non-admin from registering participants", async function () {
            await expect(
                accessManager.connect(manufacturer).registerParticipant(
                    consumer.address,
                    "Test Consumer",
                    "Home",
                    MANUFACTURER_ROLE
                )
            ).to.be.reverted;
        });
    });

    describe("SupplyChainNFT", function () {
        describe("Product Minting", function () {
            it("Should allow manufacturer to mint products", async function () {
                const tx = await supplyChainNFT.connect(manufacturer).mintProduct(
                    "PROD001",
                    "BATCH001",
                    "ipfs://metadata",
                    "Initial production"
                );

                const receipt = await tx.wait();
                expect(receipt.status).to.equal(1);

                const tokenId = await supplyChainNFT.getTokenIdByProductId("PROD001");
                expect(tokenId).to.equal(1n);

                const product = await supplyChainNFT.getProduct(tokenId);
                expect(product.productId).to.equal("PROD001");
                expect(product.batchNumber).to.equal("BATCH001");
                expect(product.currentStage).to.equal(1); // Manufactured
            });

            it("Should prevent non-manufacturer from minting", async function () {
                await expect(
                    supplyChainNFT.connect(distributor).mintProduct(
                        "PROD002",
                        "BATCH002",
                        "ipfs://metadata",
                        "Notes"
                    )
                ).to.be.reverted;
            });

            it("Should prevent duplicate product IDs", async function () {
                await supplyChainNFT.connect(manufacturer).mintProduct(
                    "PROD001",
                    "BATCH001",
                    "ipfs://metadata",
                    "Notes"
                );

                await expect(
                    supplyChainNFT.connect(manufacturer).mintProduct(
                        "PROD001",
                        "BATCH002",
                        "ipfs://metadata",
                        "Notes"
                    )
                ).to.be.revertedWith("Product ID already exists");
            });
        });

        describe("Supply Chain Flow", function () {
            let tokenId;

            beforeEach(async function () {
                await supplyChainNFT.connect(manufacturer).mintProduct(
                    "PROD001",
                    "BATCH001",
                    "ipfs://metadata",
                    "Initial production"
                );
                tokenId = await supplyChainNFT.getTokenIdByProductId("PROD001");
            });

            it("Should transfer from manufacturer to distributor", async function () {
                await supplyChainNFT.connect(manufacturer).transferToDistributor(
                    tokenId,
                    distributor.address,
                    "Warehouse B, Delhi",
                    "Shipped via truck"
                );

                const product = await supplyChainNFT.getProduct(tokenId);
                expect(product.currentStage).to.equal(2); // InDistribution
                expect(await supplyChainNFT.ownerOf(tokenId)).to.equal(distributor.address);
            });

            it("Should transfer from distributor to retailer", async function () {
                await supplyChainNFT.connect(manufacturer).transferToDistributor(
                    tokenId,
                    distributor.address,
                    "Warehouse B, Delhi",
                    "Shipped"
                );

                await supplyChainNFT.connect(distributor).transferToRetailer(
                    tokenId,
                    retailer.address,
                    "Store C, Bangalore",
                    "Delivered"
                );

                const product = await supplyChainNFT.getProduct(tokenId);
                expect(product.currentStage).to.equal(3); // InRetail
                expect(await supplyChainNFT.ownerOf(tokenId)).to.equal(retailer.address);
            });

            it("Should sell from retailer to consumer", async function () {
                await supplyChainNFT.connect(manufacturer).transferToDistributor(
                    tokenId,
                    distributor.address,
                    "Warehouse",
                    "Shipped"
                );

                await supplyChainNFT.connect(distributor).transferToRetailer(
                    tokenId,
                    retailer.address,
                    "Store",
                    "Delivered"
                );

                await supplyChainNFT.connect(retailer).sellToConsumer(
                    tokenId,
                    consumer.address,
                    "Customer Location",
                    "Purchased"
                );

                const product = await supplyChainNFT.getProduct(tokenId);
                expect(product.currentStage).to.equal(4); // Sold
                expect(await supplyChainNFT.ownerOf(tokenId)).to.equal(consumer.address);
            });

            it("Should enforce correct supply chain order", async function () {
                // Cannot transfer directly to retailer
                await expect(
                    supplyChainNFT.connect(manufacturer).transferToRetailer(
                        tokenId,
                        retailer.address,
                        "Location",
                        "Notes"
                    )
                ).to.be.reverted;
            });

            it("Should track all checkpoints", async function () {
                await supplyChainNFT.connect(manufacturer).transferToDistributor(
                    tokenId,
                    distributor.address,
                    "Warehouse",
                    "Shipped"
                );

                await supplyChainNFT.connect(distributor).transferToRetailer(
                    tokenId,
                    retailer.address,
                    "Store",
                    "Delivered"
                );

                await supplyChainNFT.connect(retailer).sellToConsumer(
                    tokenId,
                    consumer.address,
                    "Customer Home",
                    "Purchased"
                );

                const checkpointCount = await supplyChainNFT.getCheckpointCount(tokenId);
                expect(checkpointCount).to.equal(4n); // Manufacturing + 3 transfers
            });
        });

        describe("Role-Based Access", function () {
            let tokenId;

            beforeEach(async function () {
                await supplyChainNFT.connect(manufacturer).mintProduct(
                    "PROD001",
                    "BATCH001",
                    "ipfs://metadata",
                    "Notes"
                );
                tokenId = await supplyChainNFT.getTokenIdByProductId("PROD001");

                await supplyChainNFT.connect(manufacturer).transferToDistributor(
                    tokenId,
                    distributor.address,
                    "Warehouse",
                    "Shipped"
                );

                await supplyChainNFT.connect(distributor).transferToRetailer(
                    tokenId,
                    retailer.address,
                    "Store",
                    "Delivered"
                );

                await supplyChainNFT.connect(retailer).sellToConsumer(
                    tokenId,
                    consumer.address,
                    "Customer Home",
                    "Purchased"
                );
            });

            it("Should allow consumer to view full history after purchase", async function () {
                const history = await supplyChainNFT.connect(consumer).getFullProductHistory(tokenId);
                expect(history.length).to.equal(4);
            });

            it("Should restrict non-owners from full history", async function () {
                // Another consumer who doesn't own the product
                const [, , , , , anotherConsumer] = await ethers.getSigners();

                await expect(
                    supplyChainNFT.connect(anotherConsumer).getFullProductHistory(tokenId)
                ).to.be.revertedWith("Not authorized to view full history");
            });
        });

        describe("Events", function () {
            it("Should emit ProductMinted event", async function () {
                await expect(
                    supplyChainNFT.connect(manufacturer).mintProduct(
                        "PROD001",
                        "BATCH001",
                        "ipfs://metadata",
                        "Notes"
                    )
                ).to.emit(supplyChainNFT, "ProductMinted");
            });

            it("Should emit ProductTransferred event", async function () {
                await supplyChainNFT.connect(manufacturer).mintProduct(
                    "PROD001",
                    "BATCH001",
                    "ipfs://metadata",
                    "Notes"
                );
                const tokenId = await supplyChainNFT.getTokenIdByProductId("PROD001");

                await expect(
                    supplyChainNFT.connect(manufacturer).transferToDistributor(
                        tokenId,
                        distributor.address,
                        "Warehouse",
                        "Shipped"
                    )
                ).to.emit(supplyChainNFT, "ProductTransferred");
            });
        });
    });
});
