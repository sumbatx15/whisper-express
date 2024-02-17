import express, { Request, Response } from "express";
import { IMode, addMode } from "../../../db/modes";
import { getCachedSessionUser } from "../../../utils/session";
import { hasBearer, identifyAndCacheUser } from "../../middleware";
import catchAsync from "../../../utils/catchAsync";
import { z } from "zod";

export const modeSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().optional(),
  instructions: z.string().nonempty(),
  model: z.string().nonempty(),
  hidden: z.boolean().optional(),
  icon: z.object({
    name: z.string().nonempty(),
    color: z.string().nonempty(),
    pack: z.string().nonempty(),
  }),
});

const router = express.Router();

type CreateModeRequest = Request<{}, {}, { mode: IMode }>;

router.post(
  "/",
  hasBearer,
  identifyAndCacheUser,
  (req, res, next) => {
    try {
      modeSchema.parse(req.body.mode);
      next();
    } catch (error) {
      res.status(400).send({ message: "Invalid mode" });
    }
  },
  catchAsync(async (req: CreateModeRequest, res: Response) => {
    const user = getCachedSessionUser(req);
    if (!user) return res.status(401).send({ message: "User not found" });

    return res.send(await addMode(user.google_account_id, req.body.mode));
  })
);

export default router;
