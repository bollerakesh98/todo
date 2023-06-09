const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const date = require("date-fns");
const isValid = require("date-fns/isValid");
const parseISO = require("date-fns/parseISO");
const format = require("date-fns/format");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const validDate = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

const statuses = ["TO DO", "IN PROGRESS", "DONE"];
const priorities = ["HIGH", "MEDIUM", "LOW"];
const categories = ["WORK", "HOME", "LEARNING"];

//API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, dueDate } = request.query;
  const queries = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (statuses.includes(queries.status)) {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                status = '${status}';`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

    case hasPriorityProperty(request.query):
      if (
        queries.priority === "HIGH" ||
        queries.priority === "MEDIUM" ||
        queries.priority === "LOW"
      ) {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                priority = '${priority}';`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

    case hasStatusAndPriority(request.query):
      if (
        (queries.status === "TO DO" ||
          queries.status === "IN PROGRESS" ||
          queries.status === "DONE") &&
        (queries.priority === "HIGH" ||
          queries.priority === "MEDIUM" ||
          queries.priority === "LOW")
      ) {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                status = '${status}';
                AND priority = ''${priority}`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

    case hasCategoryAndStatus(request.query):
      if (
        (queries.status === "TO DO" ||
          queries.status === "IN PROGRESS" ||
          queries.status === "DONE") &&
        (queries.category === "WORK" ||
          queries.category === "HOME" ||
          queries.category === "LEARNING")
      ) {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                status = '${status}';
                AND category = '${category}'`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

    case hasCategoryProperty(request.query):
      if (
        queries.category === "WORK" ||
        queries.category === "HOME" ||
        queries.category === "LEARNING"
      ) {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                category = '${category}';`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

    case hasCategoryAndPriority(request.query):
      if (
        (queries.priority === "HIGH" ||
          queries.priority === "MEDIUM" ||
          queries.priority === "LOW") &&
        (queries.category === "WORK" ||
          queries.category === "HOME" ||
          queries.category === "LEARNING")
      ) {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                priority = '${priority}';
                AND category = '${category}'`;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    default:
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodo);
  response.send(todo);
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { search_q = "", priority, status, category, dueDate } = request.query;
  const queries = request.query;
  const givenDate = parseISO(queries.date);
  const formatedDate = format(givenDate, "yyyy-MM-dd");

  if (isValid(givenDate)) {
    const getTodo = `
        SELECT
            *
        FROM
            todo
        WHERE
             due_date = '${formatedDate}';`;
    const todo = await db.all(getTodo);
    response.send(todo);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  const givenDate = parseISO(todoDetails.dueDate);
  const formatedDate = format(givenDate, "yyyy-MM-dd");

  if (statuses.includes(todoDetails.status) !== true) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priorities.includes(todoDetails.priority) !== true) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categories.includes(todoDetails.category) !== true) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(formatedDate) !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const addTodo = `
    INSERT INTO
      todo (id, todo, priority, status, category, due_date)
    VALUES
      (
        
         ${id},
         
        '${todo}',
        
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
      );`;

    const dbResponse = await db.run(addTodo);
    const todoId = dbResponse.lastID;
    response.send("Todo Successfully Added");
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const requestBody = todoDetails;
  let updateColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    select * from todo
    where
        id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateTodoQuery = `
    update todo
    set
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    where
        id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
