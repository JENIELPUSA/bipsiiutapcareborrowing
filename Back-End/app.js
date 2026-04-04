const express = require("express");
const cors = require("cors");

const morgan = require("morgan");
const path = require("path");

const ErrorController = require("./Controller/errorController");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const AdminRoute = require("./Routes/AdminRoute");
const Rfid = require("./Routes/RFIDRegisterRoute");
const Notification = require("./Routes/NotificationRoute");

const Logs = require("./Routes/LogsRoute");

const authentic = require("./Routes/authRouter");

const categoryRoute = require("./Routes/categoryRoute");

const laboratoryRoute = require("./Routes/laboratoryRoute");

const EquipmentRoute = require("./Routes/EquipmentRoute");

const Officer = require("./Routes/OfficerRoute");
const Department = require("./Routes/departmentRoute");
const DownloadAgent = require("./Routes/DownloadRoute");
const BorrowerRoute = require("./Routes/BorrowerRoute");
const EnchargeBorrowRoute = require("./Routes/EnchargeBorrowRoute");

let app = express();

const logger = function (req, res, next) {
  console.log("Middleware Called");
  next();
};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.set("trust proxy", true);
app.use(
  session({
    secret: process.env.SECRET_STR,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.CONN_STR,
      ttl: 12 * 60 * 60, // 12 hours in seconds
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "none",
      maxAge: 12 * 60 * 60 * 1000,
    },
    rolling: true,
  }),
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(logger);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//importante ito para pag view ng picture sa table .etcc..
const uploadsDir = path.join(__dirname, "..", "uploads");

app.use("/uploads", express.static(uploadsDir));
app.use("/api/v1/authentication", authentic);
app.use("/api/v1/Admin", AdminRoute);
app.use("/api/v1/Notification", Notification);
app.use("/api/v1/LogsAudit", Logs);
app.use("/api/v1/Officer", Officer);
app.use("/api/v1/Category", categoryRoute);
app.use("/api/v1/Laboratory", laboratoryRoute);
app.use("/api/v1/Department", Department);
app.use("/api/v1/Rfid", Rfid);
app.use("/api/v1/DownloadAgent", DownloadAgent);
app.use("/api/v1/BorrowerRoute", BorrowerRoute);
app.use("/api/v1/EnchargeBorrowRoute", EnchargeBorrowRoute);
app.use("/api/v1/Equipment", EquipmentRoute);
app.use(ErrorController);

module.exports = app;
