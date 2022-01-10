"use strict";

const { Client, Intents } = require("discord.js");
const { connectDB } = require("./utilities/mongoose");
const { pushModel } = require("./db/push");
const { pullModel } = require("./db/pull");
const { token } = require("./utilities/config").config;
const { files } = require("./db/pull");
const Server = require("./models/Server");
const DEFAULT_PREFIX = "*";

// Server stuff
const { initServer } = require("./server");

const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILDS);

const client = new Client({ intents });

client.commands = {
  messageCreate: {},
};

client.modules = {
  messageCreate: {},
  voiceStateUpdate: {},
};

const registerCommand = (module, isAdminCommand = false) => {
  if (module.func && typeof module.func === "function") {
    client.modules[module.event][module.aliases[0]] = module.func;
  }
  if (module.command && typeof module.command === "function") {
    module.aliases.forEach((alias) => {
      client.commands["messageCreate"][alias] = {
        command: module.command,
        isAdminCommand,
      };
    });
  } else {
    module.aliases.forEach((alias) => {
      client.commands["messageCreate"][alias] = module;
    });
  }
};

const removeCommand = (module) => {
  if (module.func && typeof module.func === "function") {
    client.modules[module.event][module.aliases[0]] = (message) => {
      return;
    };
  }
};

client.on("ready", () => {
  let _cmds = require("fs").readdirSync("./commands");
  for (let i = 0; i < _cmds.length; i++) {
    let cmd = require(`./commands/${_cmds[i]}`);
    registerCommand(cmd);
  }

  _cmds = require("fs").readdirSync("./admin-commands");
  for (let i = 0; i < _cmds.length; i++) {
    let cmd = require(`./admin-commands/${_cmds[i]}`);
    registerCommand(cmd, true);
  }

  console.log("Logged in as " + client.user.tag + " successfully.");
});

// Handle all commands
client.on("messageCreate", async (message) => {
  // Pass on message to all passive commands
  Object.keys(client.modules["messageCreate"]).forEach((key) => {
    client.modules["messageCreate"][key](message);
  });

  // This chunk of code below is really annoying and I want to rewrite it but I don't think I can do any better
  // So here's what's happening
  // The prefix for each server is a col on the db, but by default it is the DEFAULT_PREFIX above, as of now that would be "*"
  // So to get the prefix we check the json cache, if we don't find it there we check the db directly
  // If we find it in the db, we put it in the cache
  // We could easily just pull all of the servers in the db into the cache but that quite defeats the purpose of it, the cache should be faster than talking to the db by having less data inside
  // If it's not in the db either, then we check if the command is track and if the prefix used was DEFAULT_PREFIX, in which case we run it or do nothing

  // Handle actual commands
  let guild_id = message.guildId;
  let prefix;
  let command;
  const servers = pullModel(files.servers);
  let currentServer = servers.find((server) => server.guild_id == guild_id);

  if (currentServer) {
    // Check cache
    prefix = currentServer.prefix;
  } else {
    // Not in cache, check db
    currentServer = await Server.find({ guild_id });
    currentServer = currentServer[0];

    if (currentServer && message.content.startsWith(currentServer.prefix)) {
      // If it's in db, push to cache
      pushModel(files.servers, currentServer);
      prefix = currentServer.prefix;
    } else if (message.content.startsWith(DEFAULT_PREFIX)) {
      // Not in db either, check if it's track and then execute it
      // This is so weird and convoluted but I have no other option
      // Well, I guess I could make it check when it joins a server or whenever it starts up, check if there's any servers that aren't in the db
      // But I don't like that, so I'll do this.
      command = message.content.substring(DEFAULT_PREFIX.length).toLowerCase().split(/\s+/)[0];
      if (command === "track") {
        if (!client.commands["messageCreate"][command]) {
          return;
        }

        if (typeof client.commands["messageCreate"][command].command === "function") {
          client.commands["messageCreate"][command].command(message);
        }
      } else {
        return;
      }
    }
  }

  if (!prefix) return;

  if (message.content.startsWith(prefix)) {
    // Starts with prefix
    command = message.content.substring(prefix.length).toLowerCase().split(/\s+/)[0];

    /* if (command !== "track") {
      let guild_id = message.guildId;

      let currentServer = servers.find((server) => server.guild_id === guild_id);
      if (!utils.isTrusted(message) && message.channel.id !== currentServer.bot_channel) {
        return;
      }
    } */

    if (!client.commands["messageCreate"][command]) {
      return;
    }

    if (typeof client.commands["messageCreate"][command].command === "function") {
      client.commands["messageCreate"][command].command(message);
    }
  }
});

client.on("voiceStateUpdate", (oldState, newState) => {
  // Pass on event to all commands of this type
  Object.keys(client.modules["voiceStateUpdate"]).forEach((key) => {
    client.modules["voiceStateUpdate"][key](oldState, newState);
  });
});

// These are unnecessary for now.

/* client.on("messageDelete", async (message) => {
    Object.keys(client.modules['messageDelete']).map(key => {
        client.modules['messageDelete'][key](message)
    })
})

client.on("messageUpdate", async(oldMessage, newMessage) => {
    Object.keys(client.modules['messageUpdate']).map(key => {
        client.modules['messageUpdate'][key](oldMessage, newMessage)
    })
}) */

connectDB().then(async () => {
  initServer();
  client.login(token);
});
