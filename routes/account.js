const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
// const jwt = require("../utils/jwt");

var express = require("express");
var router = express.Router();

//Create a user
router.post("/users", async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const role = req.body.role;
  const password = req.body.password;
  const hashPassword = bcrypt.hashSync(password, 1, "salt");

  const emailIsAlreadyRegistred = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  //check for missing and wrong information
  if (
    !req.body ||
    !email ||
    !role ||
    !username ||
    !hashPassword ||
    !["Owner", "Admin", "Member"].includes(role)
  ) {
    return res.status(422).json({
      message: "Missing and/or wrong information is provided.",
    });
  }

  try {
    if (emailIsAlreadyRegistred) {
      return res.status(422).json({
        message: "Emailadress already in use",
      });
    } else {
      await prisma.user.create({
        data: {
          email: email,
          role: role,
          username: username,
          password: hashPassword,
        },
      });

      return res.status(200).json({
        message: "Created a user with the corresponding information",
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//Authenticates a user
router.post("/authenticate", async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  if (!req.body || (!email && !username) || !password) {
    return res.status(422).json({
      message: "Emailadress, username and/or password are/is missing",
    });
  }

  const userIdentifier = email ? ["email", email] : ["username", username];

  try {
    const user = await prisma.user.findFirst({
      where: {
        [userIdentifier.key]: userIdentifier.value,
      },
    });

    const doesPasswordMatch = bcrypt.compareSync(password, user.password);

    if (!user || !doesPasswordMatch) {
      console.log(user);
      return res.status(422).json({
        status: "error authentication failed",
      });
    } else {
      return res.status(200).json({
        status: "authorized",
        accountAuthorized: user.email,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

module.exports = router;
