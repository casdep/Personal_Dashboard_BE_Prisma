const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const jwt = require("jsonwebtoken");

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

//get specific note
router.get("/note/:id", async (req, res) => {
  const noteId = parseInt(req.params.id);
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  try {
    const note = await prisma.note.findFirst({
      where: { id: noteId },
    });
    return res.status(200).json({ message: "Note retrieved successfully" });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//get all filtered/searched notes
router.get("/notes", async (req, res) => {
  var currentPage = req.query.page || 1;
  const listPerPage = 50;
  var offset = (currentPage - 1) * listPerPage;
  var category = req.query.category;
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  //setting filters from query
  var sort =
    req.query.sort !== undefined && Object.keys(req.query.sort).length !== 0
      ? req.query.sort.split("_")
      : ["id", "asc"];
  var orderByObject = {};
  orderByObject[sort[0]] = sort[1];
  var orderBySet = [orderByObject];

  try {
    const allNotes = await prisma.note.findMany({
      where: { category: category, userId: decoded.userId },
      skip: offset,
      take: allNotes,
      orderBy: orderBySet,
    });
    return res.status(200).json({
      data: allNotes,
      meta: { page: currentPage },
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//create a note
router.post("/notes", async (req, res) => {
  let noteContent = "";
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  if (!req.body || !noteContent) {
    return res.status(400).json({
      message: "Note content can't be empty",
    });
  }

  try {
    await prisma.note.create({
      data: {
        userId: decoded.userId,
        content: noteContent,
      },
    });
    return res.status(200).json({ message: "Note created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
});

//update a note
router.put(`/notes/:id`, async (req, res) => {
  const id = req.params.id;
  let noteContent = "";
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  if (!req.body || !noteContent) {
    return res.status(400).json({
      message: "Note content can't be empty",
    });
  }

  try {
    const note = await prisma.note.update({
      where: {
        id: Number(id),
      },
      data: {
        userId: decoded.userId,
        content: noteContent,
      },
    });
    return res.status(200).json({
      message: "Note updated",
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//delete a note
router.delete(`/notes/:id`, async (req, res) => {
  const { id } = req.params;
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  try {
    const note = await prisma.note.delete({
      where: {
        id: Number(id),
      },
    });
    return res.status(200).json({
      message: "Note deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

module.exports = router;
