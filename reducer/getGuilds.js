const fetch = require("node-fetch");
const { token } = require("../utilities/config").config;
const DISCORD_ENDPOINT = "https://discord.com/api/v8/";

module.exports.getGuilds = async (client, { access_token }) => {
  if (!access_token) return res.status(400);

  let response = await fetch(DISCORD_ENDPOINT + "users/@me/guilds", {
    headers: { Authorization: `Bearer ${access_token}` },
  }).catch((err) => console.log(err));

  if (response.status !== 200) return data({ err: `Response status ${response.status}` });

  const userGuilds = await response.json();
  /* const userAdminGuilds = userGuilds.filter(({ permissions }) => {
    return permissions & (0x8 == 0x8);
  }); */

  const botGuilds = client.guilds.cache;

  const data = [];
  userGuilds.forEach((guild) => {
    const has_bot = botGuilds.some((botGuild) => botGuild.id === guild.id);
    const is_admin = guild.permissions & (0x8 == 0x8);
    if (has_bot || is_admin)
      data.push({
        ...guild,
        has_bot,
        is_admin,
      });
  });

  return data;
};
