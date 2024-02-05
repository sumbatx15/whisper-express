import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import NodeCache from "node-cache";

import api from "./api";
import connectDB from "./db/db";
import OpenAI from "openai";

require("dotenv").config();

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(
  express.json({
    limit: "50mb",
  })
);

app.use("/api", api);

export const sessionCache = new NodeCache({
  stdTTL: 60 * 10,
  useClones: false,
});

export const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

connectDB();
export default app;
