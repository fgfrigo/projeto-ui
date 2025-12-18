"use strict";

const fastify = require("fastify");
const cookie = require("@fastify/cookie");
const secureSession = require("@fastify/secure-session");

const routes = require("./routes");

function requireSessionSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            "SESSION_SECRET missing or too short. Use a 32+ char string in env."
        );
    }
    return secret;
}

async function createApp(logger) {
    const app = await fastify({ logger });

    // Cookies
    await app.register(cookie);

    // Signed cookie session
    await app.register(secureSession, {
        // secure-session expects a key buffer (32 bytes recommended)
        key: Buffer.from(requireSessionSecret().padEnd(32, "_")).subarray(0, 32),
        cookie: {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            // em produção atrás de https: true
            secure: false
        }
    });

    await routes.init(app);

    return app;
}

module.exports = createApp;
