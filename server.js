const express = require("express");
const session = require("express-session");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const MongoDBStore = require("connect-mongodb-session")(session);
const { uri, PORT, secret } = require("./utilities/config").config;
const { login_post, logout_post } = require("./controllers/authController");

module.exports.initServer = (actions) => {
  const app = express();

  const store = new MongoDBStore({
    uri: uri,
    expires: 1000 * 60 * 60 * 24 * 7,
    collection: "login_sessions",
  });

  const sessionParser = session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    store: store,
    unset: "destroy",
  });

  app.use(sessionParser);

  // Middleware
  var corsOptions = {
    origin: `http://localhost:3000`,
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  // Authentication stuff
  app.post("/api/login", login_post);
  app.post("/api/logout", logout_post);
	app.get("/api/test", (req, res) => { return res.status(200).json({ msg : "Hello... traveler?" })});

  const server = http.createServer(app);

  server.listen(PORT, console.log(`Running on http://localhost:${PORT}`));

  // Websocket stuff
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    // Parsing for webclient using session
    console.log("Parsing session from request...");
    sessionParser(req, {}, () => {
      if (!req.session.access_token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      console.log("Session is parsed!");

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    });
  });

  const map = new Map();

  wss.on("connection", (ws, req) => {
    const { user_id } = req.session;
    const { access_token } = req.session;
    if (actions.onWsConnect) ws.send(JSON.stringify(actions.onWsConnect()));

    map.set(user_id, ws);

    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      if (actions.onWsMessage) {
        let result = await actions.onWsMessage({ ...data, access_token });
        ws.send(JSON.stringify(result));
      }
    });

    ws.on("close", function () {
      map.delete(user_id);
      if (actions.onWsClose) ws.send(JSON.stringify(actions.onWsClose()));
      console.log("Closed websocket");
    });
  });
};
