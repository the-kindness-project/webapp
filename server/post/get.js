const _ = require('lodash');
const Joi = require('joi');
const Response = require('../response');
const Post = require('../models/post');
const constants = require('../models/constants');
const sanitise = require('../models/sanitise');

const DEFAULT_LIMIT = 15;
const DEFAULT_RADIUS_KM = 5;

function kmToRadian(km) {
    const earthRadiusInKm = 6371;
    return km / earthRadiusInKm;
}

function sanitisePosts(posts) {
    return posts.map((post) =>
        _.pick(post, ['title', 'body', 'type', 'location', 'coords', 'tags', 'name', 'email', 'createdAt']),
    );
}

async function getPosts(type, lat, lon, radius, cursor, limit) {
    const query = {
        type,
        verified: true,
        status: constants.statuses.active,
        coords: {
            $geoWithin: {
                $center: [[lon, lat], kmToRadian(radius || DEFAULT_RADIUS_KM)],
            },
        },
    };
    const pagination = {};
    if (cursor) {
        pagination._id = { $gt: cursor };
    }
    return {
        total: await Post.count(query),
        posts: await Post.find(Object.assign(query, pagination))
            .sort({
                createdAt: -1,
            })
            .limit(limit || DEFAULT_LIMIT),
    };
}

async function getPosts(req) {
    try {
        await Joi.validate(req.query, {
            type: Joi.string().valid(Object.keys(constants.types)).required(),
            lat: Joi.number().required(),
            lon: Joi.number().required(),
            cursor: Joi.string().hex(),
            limit: Joi.number().max(10),
            radius: Joi.number() // radius in km
                // must be between 3 and 30 miles, with room for rounding errors
                .min(1.60934 * 2.9)
                .max(1.60934 * 30.1),
        });

        let result = await getPosts(
            req.query.type,
            req.query.lat,
            req.query.lon,
            req.query.radius,
            req.query.cursor,
            req.query.limit,
        );
        let nextCursor = null;
        if (result && result.posts && result.posts.length > 0) {
            nextCursor = result.posts[result.posts.length - 1]._id;
        }

        return Response.OK({ posts: result.posts.map((post) => sanitise.post(post)), total: result.total, nextCursor });
    } catch (err) {
        if (err.isJoi) {
            return Response.BadRequest(err.details);
        }
        throw err;
    }
}

async function getPost(req) {
    try {
        await Joi.validate(req.params, {
            id: Joi.string().hex().required(),
        });

        let post = await Post.findById(req.params.id);
        if (post && (!post.verified || post.status !== constants.statuses.active)) {
            return Response.BadRequest('post has not been verified or is not active');
        }

        return Response.OK(sanitise.post(post));
    } catch (err) {
        if (err.isJoi) {
            return Response.BadRequest(err.details);
        }
        throw err;
    }
}

module.exports = { getPosts, getPost };
