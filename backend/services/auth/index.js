import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/db.js"
import router from "./routes/auth.route.js";
import cookieParser from "cookie-parser";



const port = process.env.PORT;

const app = express();


app.use(express.json());
app.use(cookieParser());
app.use("/",router);

app.get("/", (req,res) => res.json({message: "Hello from Auth."}));

app.listen(port, () => {
    connectDB();
    console.log(`Auth running on port ${port}.`);
});

