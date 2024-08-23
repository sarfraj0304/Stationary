const express = require("express");
const { connection } = require("./database");
const { UserRouter } = require("./Routes/User.routes");
const { ItemRouter } = require("./Routes/Items.routes");
const { UserItemRouter } = require("./Routes/UserItem.routes");

const app = express();
const cors = require("cors");
app.use(express.json());

const config = {
  origin: [/localhost:\d{4}$/, 'https://stationary-frontend-lyart.vercel.app'],
  optionsSuccessStatus: 200,
};

app.use(cors(config));
app.use("/stationary", UserRouter);
app.use("/stationary", ItemRouter);
app.use("/stationary", UserItemRouter);

app.listen("8080", async () => {
  try {
    await connection;
    console.log("Mongodb is Connected");
  } catch (error) {
    console.log({ error: error });
  }
  console.log(`Server is Connected to 8080`);
});
