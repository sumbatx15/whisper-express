import express, { Request, Response } from "express";
import { getCachedSessionUser } from "../../utils/session";
import { hasBearer, identifyAndCacheUser } from "../middleware";

const router = express.Router();

router.get(
  "/",
  hasBearer,
  identifyAndCacheUser,
  (req: Request, res: Response) => {
    const user = getCachedSessionUser(req);
    if (!user) return res.status(401).send({ message: "User not found" });

    return res.send(user);
  }
);

export default router;
