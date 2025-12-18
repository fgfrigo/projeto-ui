"use strict";

const fastifyStatic = require("@fastify/static");
const path = require("path");

module.exports = {
  init: function (app) {
    app.log.info("Initializing static routes");

    app.register(fastifyStatic, {
      root: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "/client/main_module/dist"
      ),
      prefix: "/", // optional: default '/'
      decorateReply: true // Do not decorate the reply interface
    });

    app.register(fastifyStatic, {
      root: path.join(__dirname, "..", "..", "..", "/client/static"),
      prefix: "/static", // optional: default '/'
      decorateReply: false
    });

    // Serve the index.html file
    app.get("/", (request, reply) => {
      reply.sendFile(
        "index.html",
        path.join(
          __dirname,
          "..",
          "..",
          "..",
          "/client/main_module/dist"
        )
      ); // serving the index.html from user_module/dist
    });

    return app;
  }
};
