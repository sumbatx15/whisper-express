import express from "express";
import transcribeAnonymous from "./anonymous";
import transcribeUser from "./user";

const router = express.Router();
router.use("/transcribe/u", transcribeUser);
router.use("/transcribe/a", transcribeAnonymous);

export default router;
