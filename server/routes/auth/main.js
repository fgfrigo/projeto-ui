"use strict";

const path = require("path");
const jwt = require("jsonwebtoken");

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET env var (must be 32+ chars)");
    if (secret.length < 32) {
        // não impede rodar, mas avisa fortemente
        console.warn("[WARN] JWT_SECRET is shorter than 32 chars. Use 32+ chars.");
    }
    return secret;
}

function signJwt(payload) {
    const secret = getJwtSecret();

    // JWT simples: não importa usuário agora, mas você pode incluir username
    return jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn: "2h",
        issuer: "projeto-fer-ui"
    });
}

module.exports = {
    init: function (app) {
        app.log.info("Initializing auth routes");

        // Página HTML de login
        app.get("/login", async (request, reply) => {
            return reply.sendFile(
                "login.html",
                path.join(__dirname, "..", "..", "..", "client", "static")
            );
        });

        // Login (admin + senha do .env)
        app.post("/auth/login", async (request, reply) => {
            const { username, password } = request.body || {};

            const adminPassword = process.env.ADMIN_PASSWORD || "admin";

            if (username !== "admin" || password !== adminPassword) {
                return reply.code(401).send({ message: "Usuário ou senha inválidos" });
            }

            const token = signJwt({
                sub: "admin",           // subject
                username: "admin",
                // role: "admin"        // se quiser
            });

            request.session.set("user", {
                username: "admin",
                token
            });

            return reply.send({ ok: true });
        });

        app.post("/auth/logout", async (request, reply) => {
            request.session.delete();
            return reply.send({ ok: true });
        });

        app.get("/auth/me", async (request, reply) => {
            const user = request.session.get("user");
            if (!user) return reply.code(401).send({ message: "Not logged in" });

            // opcional: não retornar token no /me
            return reply.send({ user: { username: user.username } });
        });

        return app;
    }
};
