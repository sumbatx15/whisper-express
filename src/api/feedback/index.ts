import express, { Request, Response } from "express";
import { IFeedback, addAnonymousFeedback } from "../../db/main";
import { getCachedSessionUser } from "../../utils/session";
import {
  hasBearer,
  identifyAndCacheAnonymous,
  identifyAndCacheUser,
  validFingerprint,
} from "../middleware";
const router = express.Router();
type CreateFeedbackRequest = Request<
  {},
  {},
  Pick<IFeedback, "rating" | "message">
>;

router.post(
  "/a",
  hasBearer,
  validFingerprint,
  identifyAndCacheAnonymous,
  async (req: CreateFeedbackRequest, res: Response) => {
    addAnonymousFeedback(req.context.fingerprint!, req.body);
    res.send({ message: "Feedback added" });
  }
);

router.post(
  "/u",
  hasBearer,
  identifyAndCacheUser,
  async (req: CreateFeedbackRequest, res: Response) => {
    const user = getCachedSessionUser(req)!;
    addAnonymousFeedback(user.google_account_id, req.body);
    res.send({ message: "Feedback added" });
  }
);

export default router;
