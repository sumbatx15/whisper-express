import express, { Request, Response } from "express";
import { createAnonymousUser, getUserByUUID } from "../../db/user";
import { hasBearer, validFingerprint } from "../middleware";
import catchAsync from "../../utils/catchAsync";

const router = express.Router();

router.get(
  "/",
  hasBearer,
  validFingerprint,
  catchAsync(async (req: Request, res: Response) => {
    const isExsitingUser = await getUserByUUID(req.context.fingerprint!);

    if (!isExsitingUser) {
      await createAnonymousUser(req.context.fingerprint!);
      return res.send("created");
    }

    return res.send("existed");
  })
);

export default router;
