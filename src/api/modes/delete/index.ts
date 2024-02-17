import express, { Request, Response } from "express";
import { deleteMode } from "../../../db/modes";
import { getCachedSessionUser } from "../../../utils/session";
import { hasBearer, identifyAndCacheUser } from "../../middleware";
import catchAsync from "../../../utils/catchAsync";

const router = express.Router();
router.use(hasBearer, identifyAndCacheUser);

type DeleteModeRequest = Request<{}, {}, { id: string }>;

router.post(
  "/",
  catchAsync(async (req: DeleteModeRequest, res: Response) => {
    const user = getCachedSessionUser(req);
    if (!user) return res.status(401).send({ message: "User not found" });

    return res.send(await deleteMode(user.google_account_id, req.body.id));
  })
);

export default router;
