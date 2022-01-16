const User = require("../models/User");
const { getUser } = require("../utilities/utils");

module.exports.getLeaderboard = async (client, { payload }) => {
  const query = await User.find({ guild_id: payload.guild_id }).limit(10).sort({ points: "desc" });
  let topTen = [];

  let promises = query.map(async (user, index) => {
    let _user = await getUser(client, user.user_id);
    return (topTen[index] = {
      tag: _user.tag,
      balance: Math.round((user.points + Number.EPSILON) * 100) / 100,
      avatar: _user.avatarURL(),
    });
  });

  await Promise.all(promises);

  return topTen;
};
