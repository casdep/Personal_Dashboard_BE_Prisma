const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

var express = require("express");
var router = express.Router();

//get specific task
router.get("/task/:id", async (req, res) => {
  const taskId = parseInt(req.params.id);

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
      where: { category: category },
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
  const taskDiscription = req.body.discription;
  const taskPriority = parseInt(req.body.priority);

  if (
    !req.body ||
    !taskUser ||
    !taskTitle ||
    !taskCategory ||
    !taskDiscription ||
    !taskPriority
  ) {
    return res.status(400).json({
      message:
        "User, title, categoy, discription and/or priority are/is missing",
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
        user: taskUser,
        title: taskTitle,
        category: taskCategory,
        discription: taskDiscription,
        priority: taskPriority,
      },
    });
    return res.status(200).json({ message: "Task created successfully" });
  } catch (error) {
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
  const taskDiscription = req.body.discription;
  const taskPriority = parseInt(req.body.priority);

  if (
    !req.body ||
    !taskUser ||
    !taskTitle ||
    !taskCategory ||
    !taskDiscription ||
    !taskPriority
  ) {
    return res.status(400).json({
      message:
        "User, title, categoy, discription and/or priority are/is missing",
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
        user: taskUser,
        title: taskTitle,
        category: taskCategory,
        discription: taskDiscription,
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
