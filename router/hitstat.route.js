
const express = require('express');
const catchAsync = require("../util/catchAsync");
const { StreamController } = require('../controller/stream.controller');
// const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

router.get('/', catchAsync(StreamController.getHistats));
router.post('/', catchAsync(StreamController.saveHistats));


module.exports = router;