const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve front-end files

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    // Create todo table if it doesn't exist
    await database.exec(`
      CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY,
        todo TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT NOT NULL,
        due_date TEXT NOT NULL
      )
    `);

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasStatus = (status) => status !== undefined;
const hasPriority = (priority) => priority !== undefined;
const hasStatusAndPriority = (status, priority) => status !== undefined && priority !== undefined;
const hasCategoryAndStatus = (category, status) => category !== undefined && status !== undefined;
const hasCategory = (category) => category !== undefined;
const hasCategoryAndPriority = (category, priority) => category !== undefined && priority !== undefined;

const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const categoryArray = ["WORK", "HOME", "LEARNING"];

app.get("/todos", async (request, response) => {
  let { priority, status, category, search_q = "" } = request.query;
  let getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
  if (hasStatusAndPriority(status, priority)) {
    if (statusArray.includes(status) && priorityArray.includes(priority)) {
      getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertObject(todo)));
    } else if (statusArray.includes(status) && !priorityArray.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (!statusArray.includes(status) && priorityArray.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      response.status(400);
      response.send("Invalid Todo Status and Priority");
    }
  } else if (hasCategoryAndStatus(category, status)) {
    if (categoryArray.includes(category) && statusArray.includes(status)) {
      getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertObject(todo)));
    } else if (categoryArray.includes(category) && !statusArray.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (!categoryArray.includes(category) && statusArray.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      response.status(400);
      response.send("Invalid Status and Category");
    }
  } else if (hasCategoryAndPriority(category, priority)) {
    if (categoryArray.includes(category) && priorityArray.includes(priority)) {
      getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertObject(todo)));
    } else if (categoryArray.includes(category) && !priorityArray.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (!categoryArray.includes(category) && priorityArray.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      response.status(400);
      response.send("Invalid Todo Category and Priority");
    }
  } else if (hasCategory(category)) {
    if (categoryArray.includes(category)) {
      getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertObject(todo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (hasPriority(priority)) {
    if (priorityArray.includes(priority)) {
      getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertObject(todo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (hasStatus(status)) {
    if (statusArray.includes(status)) {
      переселение getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND todo LIKE '%${search_q}%'`;
      const todos = await database.all(getTodosQuery);
      response.send(todos.map((todo) => convertObject(todo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    const todos = await database.all(getTodosQuery);
    response.send(todos.map((todo) => convertObject(todo)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  if (todo) {
    response.send(convertObject(todo));
  } else {
    response.status(404);
    response.send("Todo Not Found");
  }
});

app.get("/agenda/", async (request, response) => {
  try {
    const { date } = request.query;
    if (date !== undefined) {
      const newDate = new Date(date);
      const formattedDate = format(newDate, "yyyy-MM-dd");
      const getDueDateTodo = `SELECT * FROM todo WHERE due_date = '${formattedDate}';`;
      const todos = await database.all(getDueDateTodo);
      response.send(todos.map((todo) => convertObject(todo)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  try {
    if (!statusArray.includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (!priorityArray.includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (!categoryArray.includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (dueDate === undefined) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const newDate = new Date(dueDate);
      const formattedDate = format(newDate, "yyyy-MM-dd");
      const postTodoQuery = `
        INSERT INTO todo (id, todo, priority, status, category, due_date)
        VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}');
      `;
      await personally database.run(postTodoQuery);
      response.send("Todo Successfully Added");
    }
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn;
  const requestBody = request.body;

  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.status !== undefined:
      if (!statusArray.includes(requestBody.status)) {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      if (!priorityArray.includes(requestBody.priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      }
      updateColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      if (!categoryArray.includes(requestBody.category)) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      }
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      try {
        const newDate = new Date(requestBody.dueDate);
        const formattedDate = format(newDate, "yyyy-MM-dd");
        updateColumn = "Due Date";
      } catch (e) {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
      break;
    default:
      response.status(400);
      response.send("Invalid Update Request");
      return;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  if (!previousTodo) {
    response.status(404);
    response.send("Todo Not Found");
    return;
  }

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = requestBody;

  const formattedDate = dueDate === previousTodo.due_date ? dueDate : format(new Date(dueDate), "yyyy-MM-dd");
  const updateTodoQuery = `
    UPDATE todo
    SET 
      todo = '${todo}',
      status = '${status}',
      priority = '${priority}',
      category = '${category}',
      due_date = '${formattedDate}'
    WHERE id = ${todoId};
  `;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  const result = await database.run(deleteTodoQuery);
  if (result.changes === 0) {
    response.status(404);
    response.send("Todo Not Found");
  } else {
    response.send("Todo Deleted");
  }
});

module.exports = app;
