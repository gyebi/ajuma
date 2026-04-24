import express from "express";
import { verifyFirebaseToken } from "../../src/middleware/auth.js";
import { authLimiter } from "../../src/middleware/rateLimit.js";
import { fetchMyEntitlement, fetchPlanById, fetchPlans } from "./billing.controller.js";

const router = express.Router();

router.get("/plans", fetchPlans);
router.get("/plans/:planId", fetchPlanById);
router.get("/entitlement/me", authLimiter, verifyFirebaseToken, fetchMyEntitlement);

export default router;
