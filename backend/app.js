const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const errorMiddleware = require("./middleware/error");
const path = require("path")

// Load environment variables
dotenv.config({ path: "backend/config/config.env" });

const app = express();

// Middleware to parse incoming requests
app.use(express.json({ limit: "50mb" })); // Increase JSON payload size
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" })); // Increase URL-encoded payload size
app.use(fileUpload());

// Route Imports
const product = require("./routes/productRoute");
const user = require("./routes/userRoutes");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const seller = require("./routes/sellerRoute");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.use("/api/v1", seller);

app.use(express.static(path.join(__dirname,"../frontend/build")))

app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"../frontend/build/index.html"))
})

// Middleware for handling errors
app.use(errorMiddleware);

module.exports = app;
