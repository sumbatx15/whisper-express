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
app.use(
  cors({
    origin: "chrome-extension://*",
  })
);
app.use(
  express.json({
    limit: "50mb",
  })
);

app.use("/api", api);

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error("symbat", err);
  res.status(500).json({
    message: err.message,
    errorCode: err?.errorCode,
  });
});
export const sessionCache = new NodeCache({
  stdTTL: 60 * 10,
  useClones: false,
});

export const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

connectDB();
export default app;
