const { readFileSync, writeFileSync } = require("jsonfile");

module.exports.pushModel = (file, newData) => {
  let data = readFileSync(file);
  data.push(newData);
  writeFileSync(file, data, { spaces: 2 });
};