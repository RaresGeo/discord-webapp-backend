const express = require("express");
const session = require("express-session");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const MongoDBStore = require("connect-mongodb-session")(session);
const { uri, PORT, secret } = require("./utilities/config").config;
const { login_post, logout_post } = require("./controllers/authController");

module.exports.initServer = () => {
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

  const server = http.createServer(app);

  server.listen(PORT, console.log(`Running on http://localhost:${PORT}`));

  // Websocket stuff
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on("upgrade", async (request, socket, head) => {
    // Parsing for webclient using session
    console.log("Parsing session from request...");
    sessionParser(request, {}, () => {
      if (!request.session.loggedIn) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      console.log("Session is parsed!");

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  });

  wss.on("connection", (ws, request) => {
    const userId = request.session.code;

    map.set(userId, ws);

    ws.on("message", async (message) => {
      data = JSON.parse(message);
      console.log(`Received a message from user ${userId}:`);
      console.log(data);
    });

    ws.on("close", function () {
      //   map.delete(userId);
      console.log("Closed websocket");
    });
  });
};
