import { consumeCredit, getEntitlementByUserId } from "./entitlement.repository.js";
import { getActivePlans, getPlanById } from "./plans.repository.js";

export async function fetchPlans(req, res) {
  try {
    const plans = await getActivePlans();
    return res.status(200).json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({ error: "Failed to fetch plans" });
  }
}

export async function fetchPlanById(req, res) {
  try {
    const plan = await getPlanById(req.params.planId);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    return res.status(200).json({ plan });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return res.status(500).json({ error: "Failed to fetch plan" });
  }
}

export async function fetchMyEntitlement(req, res) {
  try {
    const entitlement = await getEntitlementByUserId(req.user.uid);

    return res.status(200).json({
      entitlement,
    });
  } catch (error) {
    console.error("Error fetching entitlement:", error);
    return res.status(500).json({ error: "Failed to fetch entitlement" });
  }
}

export async function consumeMyCredit(req, res) {
  try {
    const entitlement = await consumeCredit(req.user.uid);

    return res.status(200).json({
      message: "Credit consumed successfully.",
      entitlement
    });
  } catch (error) {
    console.error("Error consuming credit:", error);

    if (error.message === "User entitlement not found") {
      return res.status(404).json({ error: "No entitlement found for this user." });
    }

    if (error.message === "No credits available") {
      return res.status(400).json({ error: "No credits available." });
    }

    return res.status(500).json({ error: "Failed to consume credit" });
  }
}
