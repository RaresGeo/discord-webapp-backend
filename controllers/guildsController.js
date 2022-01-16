const fetch = require("node-fetch");
const { token } = require("../utilities/config").config;
const DISCORD_ENDPOINT = "https://discord.com/api/v8/";

module.exports.guilds_get = async (req, res) => {
  let { access_token } = req.session;

  if (!access_token) return res.status(400);

  let response = await fetch(DISCORD_ENDPOINT + "users/@me/guilds", {
    headers: { Authorization: `Bearer ${access_token}` },
  }).catch((err) => console.log(err));

  if (response.status !== 200) return res.status(400);

  const userGuilds = await response.json();
  /* const userAdminGuilds = userGuilds.filter(({ permissions }) => {
    return permissions & (0x8 == 0x8);
  }); */

  response = await fetch(DISCORD_ENDPOINT + "users/@me/guilds", {
    headers: { Authorization: `Bot ${token}` },
  }).catch((err) => console.log(err));

  if (response.status !== 200) return res.status(400);

  const botGuilds = await response.json();

  const data = userGuilds.filter((guild) => botGuilds.some((botGuild) => botGuild.id === guild.id));

  return res.status(200).json(data);
};
