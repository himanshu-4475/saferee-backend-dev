/**
 * Module Dependencies
 */
if(!(process?.env?.FROM_SECRETS == true || process?.env?.FROM_SECRETS == "true")) {
  require("custom-env").env();
}
require("./libs/prototype");
require("./config/mainConfig");

// globalise events
const events = require("events");
global.event = new events.EventEmitter();

// globalise express
const express = require("express");
global.express = express;

// import path library
const path = require("path");
const { rootPath } = require("./libs/pathLib");
// globalise root-directory-path
global.rootPath = rootPath;

// logging
const morgan = require("morgan");

// cors package
const cors = require("cors");

// express-fileupload package
const fileUpload = require("express-fileupload");

// helmet package
const helmet = require("helmet");

// import cookie-parser
const cookieParser = require('cookie-parser');

// import all routes
const router = require("./routes/router");

// extract global config
const config = global.config;

// db config
const { dbConnect } = require("./config/db");

// miscellaneous-controls to set request and response format
const miscControls = require("./controllers/miscController");

/**
 * Initialize Express App
 */
const app = express();

// use helmet - secure headers
app.use(helmet());

// use cookies in express
app.use(cookieParser());

// enable cors
app.use(cors(global.config.corsConfig));

// disable e-tag
app.disable("etag");

// file-upload options
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

// using morgan for logging details.
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Success");
});

// app.get(`/${config?.application?.slug}`, (req, res) => {
//   res.send(
//     `Success - ${config?.application?.name} || ${config?.application?.description}`
//   );
// });

/**
 * Error Handling
 */
app.on("uncaughtException", (req, res, route, err) => {
  console.log(err);
});

/**
 * Initialize Server
 */
dbConnect(() => {
  console.log("========== booting up server ==========");
  const appServer = app.listen(
    process.env.PORT || config.application.port,
    "0.0.0.0",
    () => {
      console.log(
        "ExpressJS listening on port " +
          (process.env.PORT || config.application.port)
      );
      console.log(
        `========================`,
        `http://localhost:${config.application.port}/${config?.application?.slug}`
      );
      // console.log("process.env.NODE_APP_INSTANCE", process.env.NODE_APP_INSTANCE);
    }
  );
});

// parsing raw json
app.use(express.json({ limit: "1024mb" }));

// parsing x-www-form-urlencoded
app.use(
  express.urlencoded({
    limit: "1024mb",
    extended: true,
  })
);

// set api response object
app.use(miscControls.setApiRes);

// serve files statically
app.use(
  `/${config?.application?.slug}/app-logs`,
  express.static(path.join(rootPath, "app-logs"))
);

// serve files statically
app.use(
  `/${config?.application?.slug}/uploads`,
  express.static(path.join(rootPath, "uploads"))
);

// app-routes management
app.use(`/${config?.application?.slug}`, router);

// set 500 error response
app.use(miscControls.serverError);

// return api response object
app.use(miscControls.returnApiRes);

// set 404 endpoint
app.use(miscControls.error404);

// Handle Unhandled Rejection
process.on("unhandledRejection", (error, promise) => {
  console.log(`Unhandled Rejection Error: ${error.message}`);
});
