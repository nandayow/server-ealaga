const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
const path = require("path");
const morgan = require("morgan");
const logToMongo = require("./middlewares/log-to-mongo");
const cors = require("cors");

const dotenv = require("dotenv");

dotenv.config({ path: "config/config.env" });

// Middleware
app.use(express.json()); 
app.use(morgan("combined"));
app.use(logToMongo);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());

const user = require("./routes/user");
const schedule = require("./routes/schedule");
const health = require("./routes/health"); 
const announcement = require("./routes/announcement");
const donation = require("./routes/donation"); 
const notification = require('./routes/notification');

const api = process.env.API_URL;
app.use(`${api}/users`, user);
app.use(`${api}/schedule`, schedule);  
app.use(`${api}/donation`, donation);
app.use(`${api}`, health);
app.use(`${api}`, announcement); 
app.use(`${api}`, notification)

module.exports = app;