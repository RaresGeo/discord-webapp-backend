const { onWsMessage } = require("./onWsMessage");

module.exports.getActions = (client) => {
  return {
    onWsMessage: onWsMessage(client),
  };
};
