import express from "express";
import cors from "cors";
import db from "./utils/db.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

// import routes 

import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use(cors({

    origin: process.env.BASE_URL,
    credentials: true,
    method: ["GET", "POST","PUT", "DELETE"],
    allowedHeaders: "Content-Type, Authorization",
}))

const PORT = process.env.PORT || 3000;

app.get("/", (req,res)=>{
    res.send("Hello World");
})


db();

app.use("/api/v1/users/", userRoutes);


app.listen(PORT, ()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
    
})