require("dotenv").config(); // intitializing env file
const express = require("express");
const app = express();
const cors = require("cors"); // handling cors errors
const cookieParser = require("cookie-parser");
const { UserRouter } = require("./user.routes");

const mongoose = require("mongoose");

//initiating SERVERR
const { PORT } = process.env;
const { DB_URI } = process.env;

mongoose
  .connect(DB_URI)
  .then((res) => console.log("💽 Database is Connected Successfully"))
  .catch((err) => console.log("Please Restart Server", err));

const corsOptions = {
  origin: ["*"], // Replace with your allowed origins
  credentials: true, // Allow cookies
};

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/user", UserRouter);

//Starting Server
app.listen(PORT || 3001, () => {
  console.log(`🚀 Server is Running on PORT => `, PORT || 3001);
});
