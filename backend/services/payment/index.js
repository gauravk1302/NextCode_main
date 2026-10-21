import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDB from "./config/db.js"
import router from "./routes/payment.route.js"

const port =process.env.PORT

const app=express()
app.use(express.json())
app.use("/",router)
app.get("/",(req,res)=>{
    res.json({message:"Hello from payment service."})
})

app.listen(port,()=>{
    connectDB();
    console.log(`Payment service started at ${port}.`)
    
})