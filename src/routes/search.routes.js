const express = require('express');
const router = express.Router();
const { authUser } = require('../middlewares/auth.middleware');
const { globalSearch } = require('../controllers/search.controller');

// Search endpoint (protected, but can be public depending on your needs)
router.get('/', authUser, globalSearch);

module.exports = router;
