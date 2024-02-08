import express from "express";
import transcribeAnonymous from "./transcribe/anonymous";
import transcribeUser from "./transcribe/user";
import identifyAndCache from "./identify";

const router = express.Router();

router.use("/transcribe/u", transcribeUser);
router.use("/transcribe/a", transcribeAnonymous);
router.use("/identify", identifyAndCache);

export default router;
