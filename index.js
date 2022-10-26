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
app.get("/", (req, res) => {
  res.json({ message: "alive" });
});

//get all tasks
app.get("/tasks", async (req, res) => {
  const currentPage = req.query.page || 1;
  const listPerPage = 45;
  const offset = (currentPage - 1) * listPerPage;

  const allTasks = await prisma.task.findMany({
    skip: offset,
    take: listPerPage,
  });

  res.json({
    data: allTasks,
    meta: { page: currentPage },
  });
});

//get specific task
app.get("/task:id", async (req, res) => {
  const currentPage = req.query.page || 1;
  const listPerPage = 25;
  const offset = (currentPage - 1) * listPerPage;

  const allTasks = await prisma.task.findMany({
    skip: offset,
    take: listPerPage,
  });

  res.json({
    data: allTasks,
    meta: { page: currentPage },
  });
});

//create a task
app.post("/task", async (req, res) => {
  const taskUser = req.body.user;
  const taskTitle = req.body.title;
  const taskCategory = req.body.category;
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
app.put(`/task/:id`, async (req, res) => {
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
app.delete(`/task/:id`, async (req, res) => {
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

//////////////////////////////////////////
////////      Login          /////////////
//////////////////////////////////////////
