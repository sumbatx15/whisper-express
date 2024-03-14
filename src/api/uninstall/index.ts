import express, { Request, Response } from "express";
import { Mixpanel } from "../../mixpanel";
import { getGoogleUserInfo } from "../../service/service";

const router = express.Router();

router.get(
  "/",
  (
    req: Request<
      {},
      {},
      {},
      { fingerprint: string; token?: string; version?: string }
    >,
    res: Response
  ) => {
    if (req.query.token) {
      getGoogleUserInfo(req.query.token).then((user) => {
        Mixpanel.uninstall(req.query.fingerprint, user.sub, req.query.version);
      });
    } else {
      Mixpanel.uninstall(req.query.fingerprint, undefined, req.query.version);
    }

    return res.redirect(
      "https://docs.google.com/forms/d/e/1FAIpQLScbeqnTrrBw0ogi-KVrC-RT2mfDpm7ilcdUccUkYkbyZ69Kyw/viewform?usp=sf_link"
    );
  }
);

export default router;
