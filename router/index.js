const express = require("express");

const customRoutes = express.Router();

customRoutes.use("/auth", require("./user.route"));
customRoutes.use("/api/streams", require("./stream.route"));

module.exports = customRoutes;
