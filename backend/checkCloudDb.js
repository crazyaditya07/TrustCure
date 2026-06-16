const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Load root .env

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://PudinaPrick:Aditya2004123@trustcure.ia5kepc.mongodb.net/trustcure_db';

async function checkDB() {
    try {
        console.log('Connecting to:', MONGODB_URI.replace(/:([^:@]{3,})@/, ':***@'));
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check current database
        const db = mongoose.connection.db;
        console.log('Current database:', db.databaseName);

        // List collections
        const collections = await db.listCollections().toArray();
        console.log('Collections in this DB:', collections.map(c => c.name));

        // If users collection exists, count them and show the first one
        if (collections.some(c => c.name === 'users')) {
            const users = await db.collection('users').find({}).toArray();
            console.log(`Found ${users.length} users.`);
            if (users.length > 0) {
                console.log('Sample user email:', users[0].email);
            }
        } else {
            console.log('❌ "users" collection not found in this database!');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDB();
