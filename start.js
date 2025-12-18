"use strict";

require("dotenv").config();

(async function (createApp, logger, serverConfigs) {
  const app = await createApp(logger);

  await app.listen(
    { host: serverConfigs.host, port: serverConfigs.port },
    (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
    }
  );

  module.exports = app;
})(
  require("./server/app"),
  require("./server/helpers/logger"),
  require("./server/configs/server.js")
);
