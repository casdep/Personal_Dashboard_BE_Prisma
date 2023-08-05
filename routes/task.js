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

//get specific task
router.get("/task/:id", async (req, res) => {
  const taskId = parseInt(req.params.id);
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  try {
    const task = await prisma.task.findFirst({
      where: { id: taskId },
    });
    return res.status(200).json({ message: "Task retrieved successfully" });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//get all filtered, category tasks
router.get("/tasks", async (req, res) => {
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
    const allTasks = await prisma.task.findMany({
      where: { category: category, userId: decoded.userId },
      skip: offset,
      take: listPerPage,
      orderBy: orderBySet,
    });
    return res.status(200).json({
      data: allTasks,
      meta: { page: currentPage },
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//create a task
router.post("/tasks", async (req, res) => {
  const taskUser = req.body.user;
  const taskTitleLowercase = req.body.title.toLowerCase();
  const taskTitle =
    taskTitleLowercase.charAt(0).toUpperCase() + taskTitleLowercase.slice(1);
  const taskCategoryLowercase = req.body.category.toLowerCase();
  const taskCategory =
    taskCategoryLowercase.charAt(0).toUpperCase() +
    taskCategoryLowercase.slice(1);
  let taskDescription = "";
  if (req.body.description) {
    taskDescription = req.body.description;
  } else {
    taskDescription = null;
  }
  const taskPriority = parseInt(req.body.priority);
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  if (!req.body || !taskUser || !taskTitle || !taskCategory || !taskPriority) {
    return res.status(400).json({
      message: "User, title, categoy and/or priority are/is missing",
    });
  }

  if (taskPriority < 1 || taskPriority > 10) {
    return res.status(400).json({
      message: "Task priority must be between 1 and 10",
    });
  }

  try {
    await prisma.task.create({
      data: {
        userId: decoded.userId,
        title: taskTitle,
        category: taskCategory,
        description: taskDescription != null ? taskDescription : undefined,
        priority: taskPriority,
      },
    });
    return res.status(200).json({ message: "Task created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
});

//update a task
router.put(`/tasks/:id`, async (req, res) => {
  const id = req.params.id;
  const taskUser = req.body.user;
  const taskTitleLowercase = req.body.title.toLowerCase();
  const taskTitle =
    taskTitleLowercase.charAt(0).toUpperCase() + taskTitleLowercase.slice(1);
  const taskCategoryLowercase = req.body.category.toLowerCase();
  const taskCategory =
    taskCategoryLowercase.charAt(0).toUpperCase() +
    taskCategoryLowercase.slice(1);
  let taskDescription = "";
  if (req.body.description) {
    taskDescription = req.body.description;
  }
  const taskPriority = parseInt(req.body.priority);
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  if (!req.body || !taskUser || !taskTitle || !taskCategory || !taskPriority) {
    return res.status(400).json({
      message: "User, title, categoy and/or priority are/is missing",
    });
  }

  if (taskPriority < 1 || taskPriority > 10) {
    return res.status(400).json({
      message: "Task priority must be between 1 and 10",
    });
  }

  try {
    const task = await prisma.task.update({
      where: {
        id: Number(id),
      },
      data: {
        userId: decoded.userId,
        title: taskTitle,
        category: taskCategory,
        ...(taskDescription && { description: taskDescription }),
        priority: taskPriority,
      },
    });
    return res.status(200).json({
      message: "Task updated",
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//delete a task
router.delete(`/tasks/:id`, async (req, res) => {
  const { id } = req.params;
  const decoded = validateToken(req.headers["authorization"]);

  if (decoded.error) {
    return res.status(401).json({ message: decoded.error });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id: Number(id),
      },
    });
    return res.status(200).json({
      message: "Task deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

module.exports = router;
