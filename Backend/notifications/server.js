import express from "express";
import morgan from "morgan";

const PORT = process.env.PORT | 4000;

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.get("/api/notifications", (req , res )=>{
    return res.status(200).send("Skaffold Notifications"); 
})

app.get("/api/abc", (req , res )=>{
    return res.status(200).send("Skaffold"); 
})



app.listen(PORT, () => {
    console.log("Server running in ", PORT);
    
})