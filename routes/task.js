const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

var express = require("express");
var router = express.Router();

//get specific task
router.get("/task/:id", async (req, res) => {
  const taskId = parseInt(req.params.id);

  const firstTask = await prisma.task.findFirst({
    where: { id: taskId },
  });

  res.json({
    data: firstTask,
  });
});

// //get all tasks
// router.get("/tasks", async (req, res) => {
//   const currentPage = req.query.page || 1;
//   const listPerPage = 45;
//   const offset = (currentPage - 1) * listPerPage;

//   const allTasks = await prisma.task.findMany({
//     skip: offset,
//     take: listPerPage,
//   });

//   res.json({
//     data: allTasks,
//     meta: { page: currentPage },
//   });
// });

//get all filtered, category tasks
router.get("/tasks", async (req, res) => {
  var category = req.query.category;

  var sortIdentifier = "id";
  var sort = req.query.sort;

  var currentPage = req.query.page || 1;

  console.log(category);

  console.log(sort);

  const listPerPage = 45;
  const offset = (currentPage - 1) * listPerPage;

  const allTasks = await prisma.task.findMany({
    orderBy: [
      {
        id: "desc",
      },
    ],
    where: { category: category },
    skip: offset,
    take: listPerPage,
  });

  res.json({
    data: allTasks,
    meta: { page: currentPage },
  });
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

  console.log(taskTitle);

  if (
    !req.body ||
    !taskUser ||
    !taskTitle ||
    !taskCategory ||
    !taskDiscription ||
    !taskPriority
  ) {
    return res.status(400).json({
      message: "User, title, categoy, discription or priority is missing",
    });
  }

  if (taskPriority < 1 || taskPriority > 10) {
    return res.status(400).json({
      message: "Task priority must be between 1 and 10",
    });
  }

  try {
    const message = "Task created successfully";

    await prisma.task.create({
      data: {
        user: taskUser,
        title: taskTitle,
        category: taskCategory,
        discription: taskDiscription,
        priority: taskPriority,
      },
    });
    console.log("Created a task with the corresponding information");
    return res.json({ message });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "something went wrong" });
  }
});

//update a task
router.put(`/tasks/:id`, async (req, res) => {
  const { id } = req.params;
  const task = await prisma.task.update({
    where: {
      id: Number(id),
    },
    data: {
      title: req.body.title,
      category: req.body.category,
      discription: req.body.discription,
    },
  });
  res.json(task);
});

//delete a task
router.delete(`/tasks/:id`, async (req, res) => {
  const { id } = req.params;
  const task = await prisma.task.delete({
    // try: {
    where: {
      id: Number(id),
    },
    // },
    // catch(error) {
    // return "Task with id not found";
    // },
  });
  res.json(task);
});

module.exports = router;
