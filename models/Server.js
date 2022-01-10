const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serverSchema = new Schema({
  guild_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tracking: {
    type: Boolean,
    required: true,
  },
  bot_channels: {
    type: [String],
    required: true,
  },
  message_life: {
    type: Number,
    default: 10,
  },
  prefix: {
    type: String,
    default: "*",
  },
});

module.exports = mongoose.model("Server", serverSchema);
