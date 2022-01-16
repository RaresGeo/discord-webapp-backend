const { getGuild } = require("./getGuild");

module.exports.onWsMessage = (client) => {
  return async (msg) => {
    const { type } = msg;
    switch (type) {
      case "getGuild":
        const payload = await getGuild(client, msg);
        return { type, payload };
      default:
        console.log(type);
        break;
    }
  };
};
