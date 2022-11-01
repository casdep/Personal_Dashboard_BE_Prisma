const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

var cors = require("cors");
var express = require("express");
var app = express();

app.use(cors());
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Listening to requests on port ${port}`);
});

//Test url
app.get("/a", (req, res) => {
  res.json({ message: "alive" });
});
