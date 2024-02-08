import express, { Request, Response } from "express";
import {
  hasBearer,
  identifyAndCacheAnonymous,
  identifyAndCacheUser,
} from "../middleware";
import { bearer } from "../../utils/request";
import { sessionCache } from "../../app";
const router = express.Router();

router.get(
  "/a",
  hasBearer,
  identifyAndCacheAnonymous,
  async (req: Request, res: Response) => {
    res.send({
      ttl: sessionCache.getTtl(bearer(req)),
    });
  }
);

router.get(
  "/u",
  hasBearer,
  identifyAndCacheUser,
  async (req: Request, res: Response) => {
    res.send({
      ttl: sessionCache.getTtl(bearer(req)),
    });
  }
);

export default router;
