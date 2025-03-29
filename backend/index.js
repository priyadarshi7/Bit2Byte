const express = require("express");
const connectDB = require("./connection/dbConnect");
const app = express();

//ConnectDB
connectDB('mongodb://127.0.0.1:27017/bit')
.then(()=>console.log("MongoDB connected"));

const PORT = 8000;
app.listen(PORT, ()=>console.log(`Server started at ${PORT}`));