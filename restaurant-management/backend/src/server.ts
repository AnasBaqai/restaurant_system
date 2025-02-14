import app from "./app";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { SERVER_CONFIG } from "./config/server";

dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = SERVER_CONFIG.PORT;

app.listen(PORT, () => {
  console.log(
    `Server is running in ${SERVER_CONFIG.NODE_ENV} mode on port ${PORT}`
  );
});
