module.exports.getUser = (client, id) => {
  return client.users.fetch(id);
};
