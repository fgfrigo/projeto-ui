"use strict";

const axios = require("axios");

function requireAuth(request, reply) {
    const user = request.session.get("user");
    if (!user?.token) {
        reply.code(401).send({ message: "Not authenticated. Go to /login" });
        return null;
    }
    return user;
}

function externalBase() {
    const base = process.env.EXTERNAL_API_BASE;
    if (!base) throw new Error("Missing EXTERNAL_API_BASE env var");
    return base.replace(/\/+$/, "");
}

async function forward({ method, url, token, data, params }) {
    return axios({
        method,
        url,
        data,
        params,
        headers: {
            Authorization: `Bearer ${token}`
        },
        timeout: 20000
    });
}

module.exports = {
    init: function (app) {
        app.log.info("Initializing API proxy routes");

        // Exemplo de recurso "items" (você pode renomear depois)
        // GET  -> /api/items        -> {EXTERNAL_API_BASE}/items
        app.get("/api/items", async (request, reply) => {
            const user = requireAuth(request, reply);
            if (!user) return;

            const res = await forward({
                method: "GET",
                url: `${externalBase()}/items`,
                token: user.token,
                params: request.query
            });

            return reply.code(res.status).send(res.data);
        });

        // POST -> /api/items        -> {EXTERNAL_API_BASE}/items
        app.post("/api/items", async (request, reply) => {
            const user = requireAuth(request, reply);
            if (!user) return;

            const res = await forward({
                method: "POST",
                url: `${externalBase()}/items`,
                token: user.token,
                data: request.body
            });

            return reply.code(res.status).send(res.data);
        });

        // PUT  -> /api/items/:id    -> {EXTERNAL_API_BASE}/items/:id
        app.put("/api/items/:id", async (request, reply) => {
            const user = requireAuth(request, reply);
            if (!user) return;

            const { id } = request.params;

            const res = await forward({
                method: "PUT",
                url: `${externalBase()}/items/${encodeURIComponent(id)}`,
                token: user.token,
                data: request.body
            });

            return reply.code(res.status).send(res.data);
        });

        // DELETE -> /api/items/:id  -> {EXTERNAL_API_BASE}/items/:id
        app.delete("/api/items/:id", async (request, reply) => {
            const user = requireAuth(request, reply);
            if (!user) return;

            const { id } = request.params;

            const res = await forward({
                method: "DELETE",
                url: `${externalBase()}/items/${encodeURIComponent(id)}`,
                token: user.token
            });

            return reply.code(res.status).send(res.data);
        });

        app.get("/api/cep/:cep", async (request, reply) => {
            const user = requireAuth(request, reply);
            if (!user) return;

            const { cep } = request.params;

            const res = await axios({
                method: "GET",
                url: `${externalBase()}/external/cep/${encodeURIComponent(cep)}`,
                headers: { Authorization: `Bearer ${user.token}` },
                timeout: 20000
            });

            return reply.code(res.status).send(res.data);
        });

        return app;
    }
};
