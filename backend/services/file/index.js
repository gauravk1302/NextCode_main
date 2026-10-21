import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import router from "./routes/file.route.js";

const port = process.env.PORT;

const app = express();
app.use(express.json());
app.use("/", router);
app.get("/", (req, res) => {
  res.json({ message: "Hello from file Service" });
});

app.listen(port, () => {
  connectDB();
  console.log(`File Service started at ${port}.`);
});
