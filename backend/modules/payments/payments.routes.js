import express from "express";
import { verifyFirebaseToken } from "../../src/middleware/auth.js";
import { authLimiter } from "../../src/middleware/rateLimit.js";
import { handlePaystackWebhook } from "./webhooks.controller.js";
import {
  fetchMyPayments,
  initializePayment,
  verifyPayment,
} from "./payments.controller.js";

const router = express.Router();

router.post("/webhook", handlePaystackWebhook);
router.post("/initialize", authLimiter, verifyFirebaseToken, initializePayment);
router.get("/verify/:reference", authLimiter, verifyFirebaseToken, verifyPayment);
router.get("/mine", authLimiter, verifyFirebaseToken, fetchMyPayments);

export default router;
