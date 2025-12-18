"use strict";

const mainStaticRoutes = require("./static/main");
const authRoutes = require("./auth/main");
const apiProxyRoutes = require("./api/proxy");

module.exports = {
    init: async function (app) {
        authRoutes.init(app);
        apiProxyRoutes.init(app);

        // deixe static por último, para não “engolir” rotas
        mainStaticRoutes.init(app);

        app.log.info("Routes initialized");
    }
};
