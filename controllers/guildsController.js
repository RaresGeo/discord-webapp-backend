const fetch = require("node-fetch");
const DISCORD_ENDPOINT = "https://discord.com/api/v8/";

module.exports.guilds_get = async (req, res) => {
  let { access_token } = req.session;

  if (!access_token) return res.status(400);

  response = await fetch(DISCORD_ENDPOINT + "users/@me/guilds", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  data = await response.json();

  return res.status(200).json(data);
};
