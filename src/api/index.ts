import express from "express";
import transcribeAnonymous from "./transcribe/anonymous";
import transcribeUser from "./transcribe/user";

const router = express.Router();

router.use("/transcribe/u", transcribeUser);
router.use("/transcribe/a", transcribeAnonymous);

export default router;
