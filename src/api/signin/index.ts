import express, { Request, Response } from "express";
import { createNewUser, getUser } from "../../db/user";
import { Mixpanel } from "../../mixpanel";
import catchAsync from "../../utils/catchAsync";
import { hasBearer, validGoogleToken } from "../middleware";

const router = express.Router();

router.post(
  "/",
  hasBearer,
  validGoogleToken,
  catchAsync(
    async (req: Request<{}, {}, { fingerprint: string }>, res: Response) => {
      const tokenInfo = req.context.tokenInfo!;
      const user = await getUser(tokenInfo.sub);

      if (!user) {
        await createNewUser(tokenInfo);
        Mixpanel["User created"](tokenInfo.email, req.body.fingerprint);
      }

      res.send("ok");
    }
  )
);

export default router;
