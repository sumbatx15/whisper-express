import express, { Request, Response } from "express";
import { IMode, updateMode } from "../../../db/modes";
import catchAsync from "../../../utils/catchAsync";
import { getCachedSessionUser } from "../../../utils/session";
import { hasBearer, identifyAndCacheUser } from "../../middleware";

const router = express.Router();
router.use(hasBearer, identifyAndCacheUser);

type UdapteModeRequest = Request<{}, {}, { id: string; mode: IMode }>;

router.post(
  "/",
  catchAsync(async (req: UdapteModeRequest, res: Response) => {
    const user = getCachedSessionUser(req);
    if (!user) return res.status(401).send({ message: "User not found" });

    return res.send(
      await updateMode(user.google_account_id, req.body.id, req.body.mode)
    );
  })
);

export default router;
