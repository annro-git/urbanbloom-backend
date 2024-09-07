require("dotenv").config();
require("./models/connection");

const express = require("express");
const fileupload = require("express-fileupload");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/user");
const gardensRouter = require("./routes/garden");
const pagesRouter = require("./routes/page");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(fileupload());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/user/", usersRouter);
app.use("/garden/", gardensRouter);
app.use("/page/", pagesRouter);

module.exports = app;
