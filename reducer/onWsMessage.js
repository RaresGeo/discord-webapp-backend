const { getGuilds } = require("./getGuilds");
const { getLeaderboard } = require("./getLeaderboard");

module.exports.onWsMessage = (client) => {
  return async (msg) => {
    let payload;
    const { type } = msg;
    switch (type) {
      case "getGuilds":
        payload = await getGuilds(client, msg);
        return { type, payload };
      case "getLeaderboard":
        payload = await getLeaderboard(client, msg);
        return { type, payload };
      default:
        console.log(type);
        break;
    }
  };
};
