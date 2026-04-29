import express from "express";
import askRoutes from "./routes/ask.routes";
import authRoutes from "./routes/auth.routes";

// bun auto loads .env file, if it exists, and makes the variables available in process.env

const app = express();
app.use(express.json());

app.use("/ask", askRoutes);
app.use("/auth", authRoutes);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
