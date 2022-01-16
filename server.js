const express = require("express");
const session = require("express-session");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const MongoDBStore = require("connect-mongodb-session")(session);
const { uri, PORT, secret } = require("./utilities/config").config;
const { login_post, logout_post } = require("./controllers/authController");
const { guilds_get } = require("./controllers/guildsController");

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
  app.post("/login", login_post);
  app.post("/logout", logout_post);

  // Other routes will go here
  app.get("/guilds", guilds_get);

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
    const userId = req.session.user_id;
    if (actions.onWsConnect) ws.send(JSON.stringify(actions.onWsConnect()));

    map.set(userId, ws);

    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      if (actions.onWsMessage) {
        let result = await actions.onWsMessage(data);
        console.log("Result: ", result);
        ws.send(JSON.stringify(result));
      }
    });

    ws.on("close", function () {
      map.delete(userId);
      if (actions.onWsClose) ws.send(JSON.stringify(actions.onWsClose()));
      console.log("Closed websocket");
    });
  });
};
