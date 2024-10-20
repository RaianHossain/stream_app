const jwt = require("jsonwebtoken");

/**
 * Generates new access and refresh tokens for a user.
 * @param {Object} user - The user object.
 * @param {string} user.id - The user ID.
 * @returns {Object} - An object containing the generated token and refresh token.
 */
const getNewTokens = (user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, type: "access" },
    process.env.SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  return token ;
};

module.exports = getNewTokens;
