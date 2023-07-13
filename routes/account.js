const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretToken = "mijnGeheimeCode";

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
  const userIdentifier = req.body.userIdentifier;
  const password = req.body.password;

  if (!userIdentifier || !password) {
    return res.status(422).json({
      message: "Email address, username, and/or password are missing",
    });
  }

  const identifierType = userIdentifier.match(/^\S+@\S+\.\S+$/)
    ? ["email", userIdentifier]
    : ["username", userIdentifier];

  try {
    const user = await prisma.user.findFirst({
      where: {
        [identifierType[0]]: identifierType[1],
      },
    });

    const doesPasswordMatch = bcrypt.compareSync(password, user.password);

    if (!user || !doesPasswordMatch) {
      return res.status(422).json({
        status: "error authentication failed",
      });
    } else {
      const token = jwt.sign({ userId: user.id }, secretToken, {
        expiresIn: "7d",
      });

      return res.status(200).json({
        status: "authorized",
        accountAuthorized: user.email,
        token: token,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

module.exports = router;
