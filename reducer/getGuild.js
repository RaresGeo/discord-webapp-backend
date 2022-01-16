module.exports.getGuild = async (client, { payload }) => {
  const guild = await client.guilds.fetch(payload.guild_id).catch((err) => console.log(err));
  return guild;
};
