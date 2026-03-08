const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        // Password is optional - users can auth via wallet OR email/password
    },
    roles: {
        type: [String],
        enum: ['ADMIN', 'MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'CONSUMER'],
        default: ['CONSUMER']
    },
    // Keep role field for backward compatibility
    role: {
        type: String,
        enum: ['ADMIN', 'MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'CONSUMER'],
        default: 'CONSUMER'
    },
    name: {
        type: String,
        required: true
    },
    company: {
        type: String
    },
    location: {
        address: String,
        city: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ createdAt: -1 });

// Method to get public profile
userSchema.methods.toPublicProfile = function () {
    return {
        walletAddress: this.walletAddress,
        roles: this.roles,
        role: this.role,
        name: this.name,
        company: this.company,
        location: this.location?.city,
        isVerified: this.isVerified
    };
};

// Pre-save hook to sync role with roles array
userSchema.pre('save', function (next) {
    if (this.isModified('roles') && this.role === 'CONSUMER') {
        // Set primary role as first role in array (excluding CONSUMER if other roles exist)
        const nonConsumerRoles = this.roles.filter(r => r !== 'CONSUMER');
        this.role = nonConsumerRoles.length > 0 ? nonConsumerRoles[0] : 'CONSUMER';
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
