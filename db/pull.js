const { readFileSync } = require("jsonfile");
const Server = require("../models/Server");
const rolesFile = "./db/json/roles.json";
const serversFile = "./db/json/servers.json";

module.exports.pullModel = (file) => {
  return readFileSync(file);
};

module.exports.files = {
  roles: rolesFile,
  servers: serversFile,
};
