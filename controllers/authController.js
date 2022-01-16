const fetch = require("node-fetch");
const { CLIENT_ID, CLIENT_SECRET } = require("../utilities/config").config;
const DISCORD_ENDPOINT = "https://discord.com/api/v8/";

const getAuthCode = async (code, redirect_uri) => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri,
    }),
  };

  const response = await fetch(DISCORD_ENDPOINT + "oauth2/token", requestOptions).catch((err) => console.log(err));
  const data = await response.json();
  return data;
};

const refreshAuthCode = async (refresh_token) => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    }),
  };

  const response = await fetch(DISCORD_ENDPOINT + "oauth2/token", requestOptions).catch((err) => console.log(err));
  const data = await response.json();
  return data;
};

const oneDay = () => {
  return 1000 * 60 * 60 * 24;
};

module.exports.login_post = async (req, res) => {
  let { code, redirect_uri } = req.body;
  let data = {};
  const today = new Date();

  if (req.session.refresh_token) {
    if (today.getTime() > req.session.renew_at) data = await refreshAuthCode(req.session.refresh_token);
    else data = req.session;
  } else if (!code) {
    return res.status(200).json({ err: "No code provided." });
  } else if (data.error || !req.session.refresh_token) {
    data = await getAuthCode(code, redirect_uri);
  }

  let { access_token, refresh_token, expires_in } = data;

  req.session.access_token = access_token;
  req.session.refresh_token = refresh_token;
  req.session.renew_at = req.session.renew_at ? req.session.renew_at : today.getTime() + expires_in * 1000 - oneDay();

  response = await fetch(DISCORD_ENDPOINT + "users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  data = await response.json();
  if (data.id) {
    req.session.user_id = data.id;
  }

  return res.status(200).json(data);
};

module.exports.logout_post = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
  });
  console;

  return res.status(200).json({ msg: `Logged out successfully` });
};
