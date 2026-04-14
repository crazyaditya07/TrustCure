#!/usr/bin/env node

/**
 * TrustCure Registration Debug Tool
 * 
 * This script helps debug registration issues by:
 * 1. Checking if backend is running
 * 2. Checking if a user exists in the database
 * 3. Showing user data if exists
 */

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

async function checkBackend() {
    console.log('\n🔍 Checking backend status...');
    try {
        const response = await fetch(`${API_URL}/stats`);
        if (response.ok) {
            console.log('✅ Backend is running on', API_URL);
            return true;
        } else {
            console.log('⚠️  Backend responded with status:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend is NOT running or not accessible');
        console.log('   Error:', error.message);
        console.log('   Make sure to start backend: cd backend && npm start');
        return false;
    }
}

async function checkUser(walletAddress) {
    console.log('\n🔍 Checking user registration for:', walletAddress);
    try {
        const response = await fetch(`${API_URL}/users/${walletAddress}`);

        if (response.ok) {
            const userData = await response.json();
            console.log('✅ User IS registered');
            console.log('\nUser Data:');
            console.log('  Name:', userData.name);
            console.log('  Email:', userData.email || 'Not provided');
            console.log('  Role:', userData.role);
            console.log('  Roles:', userData.roles);
            console.log('  Company:', userData.company || 'Not provided');
            console.log('  Registered:', new Date(userData.registeredAt).toLocaleString());
            return true;
        } else if (response.status === 404) {
            console.log('⚠️  User is NOT registered');
            console.log('   This user will be redirected to /register page');
            return false;
        } else {
            console.log('⚠️  Unexpected response:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Error checking user:', error.message);
        return false;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log('   TrustCure Registration Debug Tool');
    console.log('═══════════════════════════════════════════');

    const walletAddress = process.argv[2];

    if (!walletAddress) {
        console.log('\n❌ Please provide a wallet address');
        console.log('\nUsage:');
        console.log('  node debug-registration.js 0x1234...');
        console.log('\nExample:');
        console.log('  node debug-registration.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
        process.exit(1);
    }

    // Check backend
    const backendOk = await checkBackend();

    if (!backendOk) {
        console.log('\n⚠️  Cannot check user registration - backend is not running');
        process.exit(1);
    }

    // Check user
    await checkUser(walletAddress);

    console.log('\n═══════════════════════════════════════════');
    console.log('   Debug complete');
    console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
