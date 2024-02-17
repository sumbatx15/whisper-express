import express, { Request, Response } from "express";
import { getModes } from "../../../db/modes";
import { getCachedSessionUser } from "../../../utils/session";
import { hasBearer, identifyAndCacheUser } from "../../middleware";
import catchAsync from "../../../utils/catchAsync";

const router = express.Router();
router.use(hasBearer, identifyAndCacheUser);

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const user = getCachedSessionUser(req);
    if (!user) return res.status(401).send({ message: "User not found" });

    return res.send(await getModes(user.google_account_id));
  })
);

export default router;
