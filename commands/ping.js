"use strict";

module.exports = {
  aliases: ["ping"],
  event: "messageCreate",
};

module.exports.command = async (message) => {
  message.channel.send("Pong!");
};
