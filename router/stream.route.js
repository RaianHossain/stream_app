const express = require('express');
const catchAsync = require("../util/catchAsync");
const { StreamController } = require('../controller/stream.controller');
const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

router.get('/', checkAuth, StreamController.getStreams);
router.get('/:streamId', StreamController.getStream);
router.post('/', checkAuth, StreamController.createStream);
router.put('/:id', checkAuth, StreamController.updateStream);
router.delete('/:id', StreamController.deleteStream);

module.exports = router;