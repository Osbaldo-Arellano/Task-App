const mongoose = require("mongoose");
require("dotenv").config();

mongoose.Promise = global.Promise;

mongoose
  .connect(process.env.MONGOSTRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(process.env.MONGOSTRING);
    console.log("Error when connecting to DB");
  });

module.exports = {
  mongoose,
};
