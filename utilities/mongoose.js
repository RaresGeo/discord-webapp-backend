const mongoose = require("mongoose");
const { config } = require("./config");
const mongoURI = config.uri;

module.exports.connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to mongoDB");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};