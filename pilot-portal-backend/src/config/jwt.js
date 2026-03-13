const crypto = require("crypto");

const SECRET_BYTES = 64;

function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = crypto.randomBytes(SECRET_BYTES).toString("hex");
    console.warn(
      "[Auth] JWT_SECRET not provided. Generated ephemeral secret for this runtime. Tokens will be invalid after server restart."
    );
  }

  return process.env.JWT_SECRET;
}

module.exports = {
  ensureJwtSecret,
};
