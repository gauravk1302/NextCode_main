import dotenv from "dotenv";
dotenv.config();

import express from "express";
import router from "./routes/project.route.js";
import connectDB from "./config/db.js";

const port = process.env.PORT;


const app =  express();
app.use(express.json());
app.use("/",router);
app.get("/",(req,res) => {
    res.json({message: "Hello from project service"})
})

app.listen(port,() => {
    connectDB();
    console.log(`Project service started at ${port}.`);
})