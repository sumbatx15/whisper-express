import express from "express";
import transcribeAnonymous from "./transcribe/anonymous";
import transcribeUser from "./transcribe/user";
import identifyAndCache from "./identify";
import feedback from "./feedback";
import getUser from "./user";
import signin from "./signin";
import uninstall from "./uninstall";
import createAnonymous from "./createAnonymous";

import getModes from "./modes/get";
import createMode from "./modes/create";
import deleteMode from "./modes/delete";
import updateMode from "./modes/update";

import transcribeBlob from "./transcribeBlob";

const router = express.Router();

router.use("/", (req, res, next) => {
  req.context = {};
  next();
});

router.use("/signin", signin);

router.use("/u", getUser);
router.use("/ca", createAnonymous);

router.use("/identify", identifyAndCache);
router.use("/feedback", feedback);

router.use("/transcribe/u", transcribeUser);
router.use("/transcribe/a", transcribeAnonymous);

router.use("/modes/get", getModes);
router.use("/modes/create", createMode);
router.use("/modes/delete", deleteMode);
router.use("/modes/update", updateMode);
router.use("/uninstall", uninstall);

router.use("/v2/", transcribeBlob);

export default router;
