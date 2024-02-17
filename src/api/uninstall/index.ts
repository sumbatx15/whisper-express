import express, { Request, Response } from "express";
import { Mixpanel } from "../../mixpanel";

const router = express.Router();

router.get(
  "/",
  (req: Request<{}, {}, {}, { fingerprint: string }>, res: Response) => {
    const fingerprint = req.query.fingerprint;
    Mixpanel.uninstall(fingerprint);

    return res.redirect(
      "https://docs.google.com/forms/d/e/1FAIpQLScbeqnTrrBw0ogi-KVrC-RT2mfDpm7ilcdUccUkYkbyZ69Kyw/viewform?usp=sf_link"
    );
  }
);

export default router;
