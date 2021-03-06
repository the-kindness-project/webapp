const mongoose = require('mongoose');
const pointSchema = require('./point');
const constants = require('./constants');

module.exports = mongoose.model(
    'Post',
    new mongoose.Schema(
        {
            title: {
                type: String,
                required: true,
            },
            body: {
                type: String,
                required: false,
            },
            type: {
                type: String,
                enum: Object.keys(constants.types),
                required: true,
            },
            location: {
                type: String,
                required: true,
            },
            coords: {
                type: pointSchema,
                required: true,
            },
            tags: {
                type: [String],
                enum: Object.keys(constants.tags),
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
            verifyHash: {
                type: String,
                required: true,
            },
            verified: {
                type: Boolean,
                default: false,
                required: true,
            },
            status: {
                type: String,
                enum: Object.keys(constants.statuses),
                default: constants.statuses.active,
                required: true,
            },
            teardownHash: {
                type: String,
                required: true,
            },
            teardownReason: {
                type: String,
                required: false,
            },
        },
        { timestamps: true },
    ),
);
