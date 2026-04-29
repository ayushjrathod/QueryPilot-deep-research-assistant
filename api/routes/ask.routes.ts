import express from "express";
import { askController, askFollowUpController } from "../controllers/ask.controller";

const router = express.Router();

router.post("/", askController);
router.post("/follow-up", askFollowUpController);

export default router;
