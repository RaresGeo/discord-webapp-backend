const fetch = require("node-fetch");
const { CLIENT_ID, CLIENT_SECRET } = require("../utilities/config").config;
const DISCORD_ENDPOINT = "https://discord.com/api/v8/";

module.exports.login_post = async (req, res) => {
  let { code } = req.body;
  let requestOptions;

  if (req.session.refresh_token) {
    console.log("Refreshing token", req.session.refresh_token);
    requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: req.session.refresh_token,
      }),
    };
  } else {
    requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:3000/login",
      }),
    };
  }

  let response = await fetch(DISCORD_ENDPOINT + "oauth2/token", requestOptions).catch((err) => console.log(err));
  let data = await response.json();

  if (data.error) {
    console.log("Refreshing didn't work for some reason, just get a new one instead.");
    requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:3000/login",
      }),
    };

    let response = await fetch(DISCORD_ENDPOINT + "oauth2/token", requestOptions).catch((err) => console.log(err));
    data = await response.json();
  }

  let { access_token, refresh_token } = data;

  req.session.access_token = access_token;
  req.session.refresh_token = refresh_token;

  response = await fetch(DISCORD_ENDPOINT + "users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  data = await response.json();
  console.log(data);

  return res.status(200).json(data);
};

module.exports.logout_post = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
  });

  return res.status(200).json({ msg: `Logged out successfully` });
};
