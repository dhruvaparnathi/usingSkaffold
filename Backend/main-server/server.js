import express from "express";
import morgan from "morgan";

const PORT = process.env.PORT | 3000;

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req , res )=>{
    return res.status(200).send("Hello Skaffold"); 
})
app.get("/api/abc", (req , res )=>{
    return res.status(200).send("Skaffold"); 
})



app.listen(PORT, () => {
    console.log("Server running in ", PORT);
    
})