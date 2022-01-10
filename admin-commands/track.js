"use strict";

const { config } = require("../utilities/config");
const Server = require("../models/Server");

module.exports = {
  aliases: ["track"],
  event: "voiceStateUpdate",
};

const alreadyIsTracked = `This server is already being tracked, run \`${config.prefix}untrack\` to untrack.`;

module.exports.func = async (oldState, newState) => {
  return;

  // New voice event, here's what we need to do
  // First of all check if the guild the event happened in is being tracked.
  let guild_id = newState.guild.id;
  let _server = await Server.findOne({ guild_id });

  if (!(_server && _server.is_enabled)) {
    return;
  }

  let user_id = newState.id;

  utils.updatePoints(user_id, newState.guild, oldState);
};

module.exports.command = async (message) => {
  let guild_id = message.guildId;
  let _server = await Server.findOne({ guild_id });

  // We did not find the _server, create the model.
  if (!_server) {
    _server = new Server({
      guild_id,
      tracking: true,
      bot_channels: [message.channel.id],
    });
    
    message.channel.send("Started tracking server. THIS IS TEMP");
  }

  await _server.save().catch((err) => console.log(err));
};
