import express from "express";
import {
  signInController,
  signUpController,
  refreshTokenController,
  signOutController,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.post("/sign-up", signUpController);
router.post("/sign-in", signInController);
router.post("/refresh-token", authenticateToken, refreshTokenController);
router.post("/sign-out", authenticateToken, signOutController);

export default router;
