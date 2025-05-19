import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const db =()=>{
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Database connected successfully"); 
    })
    .catch((err)=>{
        console.log("DB not Connected",err);
    })

}

export default db;