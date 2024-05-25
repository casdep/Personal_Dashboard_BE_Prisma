const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretToken = "mijnGeheimeCode";

var express = require("express");
var router = express.Router();

function validateToken(cookieToken) {
  const token = cookieToken && cookieToken.split(" ")[1]; // Extract the token from the Authorization header
  if (!token) {
    return { error: "Missing token" };
  }
  try {
    const decodedToken = jwt.verify(token, "mijnGeheimeCode");
    return decodedToken;
  } catch (error) {
    return { error: "Invalid token" };
  }
}

//Create a user
router.post("/users", async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const hashPassword = bcrypt.hashSync(password, 1, "salt");

  const emailIsAlreadyRegistred = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  //check for missing and wrong information
  if (!req.body || !email || !username || !hashPassword) {
    return res.status(422).json({
      message: "Missing and/or wrong information is provided.",
    });
  }

  if (username.includes("@")) {
    return res.status(422).json({
      message: "Username can't contain the following character: @",
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
          username: username,
          password: hashPassword,
          role: "user",
        },
      });
      return res.status(200).json({
        message: "Created a user with the corresponding information",
      });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
});

//Search user
router.get("/users", async (req, res) => {
  let userIdentifier = req.query.userIdentifier;
  let identifierType = {};

  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.role !== "admin") {
    return res
      .status(401)
      .json({ message: "User role is not sufficient to get users" });
  }

  if (userIdentifier) {
    identifierType = userIdentifier.match(/^\S+@\S+\.\S+$/)
      ? ["email", userIdentifier]
      : ["username", userIdentifier];
  }

  var currentPage = req.query.page || 1;
  const listPerPage = 50;
  var offset = (currentPage - 1) * listPerPage;

  try {
    const allUsers = await prisma.user.findMany({
      where: {
        [identifierType[0]]: {
          contains: identifierType[1],
        },
      },
      skip: offset,
      take: listPerPage,
    });
    const updatedUsers = allUsers.map((obj) => {
      const { password, ...rest } = obj;
      return rest;
    });
    return res.status(200).json({
      data: updatedUsers,
      meta: { page: currentPage },
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//Authenticates a user
router.post("/authenticate", async (req, res) => {
  const userIdentifier = req.body.userIdentifier;
  const password = req.body.password;

  if (!req.body || !userIdentifier || !password) {
    return res.status(422).json({
      message: "Emailadress, username and/or password are/is missing",
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
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        secretToken,
        {
          expiresIn: "365d",
        }
      );

      return res.status(200).json({
        status: "authorized",
        accountAuthorized: user.email,
        token: token,
      });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
});

// Update user information (username, email, password, or profile picture)
router.put(`/users/:id`, async (req, res) => {
  const userId = parseInt(req.params.id);
  const { action, value } = req.body;
  const decoded = validateToken(req.headers["authorization"]);

  try {
    let updateData = {};
    switch (action) {
      case "editName":
        updateData.username = value;
        break;
      case "editEmail":
        updateData.email = value;
        break;
      case "editPassword":
        updateData.password = value;
        break;
      case "editProfilePicture":
        updateData.profilePicture = value;
        break;
      case "editRole":
        if (decoded.userId === userId) {
          return res
            .status(401)
            .json({ message: "You can not change your own role" });
        }
        if (decoded.role !== "admin") {
          return res
            .status(401)
            .json({ message: "You role is not sufficient to change roles" });
        }
        updateData.role = value;
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: Number(userId),
      },
      data: updateData,
    });
    res.json(
      Object.keys(updateData)[0] +
        " of user " +
        updatedUser.username +
        ", has been changed!"
    );
  } catch (error) {
    console.error("Error updating user information:", error);
    res.status(500).json({ error: "Failed to update user information" });
  }
});

// Get user's profile image
router.get(`/users/profile-picture/:id`, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true },
    });

    if (user && user.profilePicture) {
      res.json({ profilePicture: user.profilePicture });
    } else {
      res.json({ message: "Profile picture not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to get profile picture" });
  }
});

module.exports = router;
