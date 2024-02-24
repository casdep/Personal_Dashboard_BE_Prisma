const cors = require("cors");
const express = require("express");
const app = express();

var config = require("./config.json");

app.use(cors());
app.use(express.json({limit: '50mb'}));

var accountRoutes = require("./routes/account");
var taskRoutes = require("./routes/task");

app.use("/account-management", accountRoutes);
app.use("/task-management", taskRoutes);

//Boot-up message
app.listen(config, () => {
  console.log(`Listening to requests on port ${config.port}`);
});

//Test end-point
app.get("/", (req, res) => {
  res.json({ message: "alive" });
});
