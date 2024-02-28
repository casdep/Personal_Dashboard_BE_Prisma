const cors = require("cors");
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));

var config = require("./config.json");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

var accountRoutes = require("./routes/account");
var taskRoutes = require("./routes/task");
var noteRoutes = require("./routes/note");

app.use("/account-management", accountRoutes);
app.use("/task-management", taskRoutes);
app.use("/note-management", noteRoutes);

//Boot-up message
app.listen(config, () => {
  console.log(`Listening to requests on port ${config.port}`);
});

//Test end-point
app.get("/", (req, res) => {
  res.json({ message: "alive" });
});
