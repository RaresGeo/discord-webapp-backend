require("dotenv").config();

module.exports.config = {
  uri: process.env.uri,
  token: process.env.token,
  PORT: process.env.PORT,
  secret: process.env.secret,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
};
