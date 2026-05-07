export const defaultPlans = [
  {
    id: "starter",
    code: "starter",
    name: "Starter",
    amount: 5,
    currency: "GHS",
    credits: 3,
    cadence: "",
    description: "For a focused first batch of applications.",
    active: true,
    sortOrder: 1,
  },
  {
    id: "standard",
    code: "standard",
    name: "Standard",
    amount: 10,
    currency: "GHS",
    credits: 7,
    cadence: "",
    description: "For steady job seekers applying with more consistency.",
    active: true,
    featured: true,
    sortOrder: 2,
  },
  {
    id: "pro",
    code: "pro",
    name: "Pro",
    amount: 20,
    currency: "GHS",
    credits: 20,
    cadence: "",
    description: "For active job seekers who want more application capacity.",
    active: true,
    theme: "dark",
    sortOrder: 3,
  },
];

export function normalizePlanKey(value = "") {
  return String(value).trim().toLowerCase();
}

export function orderPlans(plans = []) {
  const preferredOrder = new Map([
    ["starter", 1],
    ["standard", 2],
    ["pro", 3],
    ["premium", 3],
    ["advanced", 3],
  ]);

  return [...plans].sort((firstPlan, secondPlan) => {
    const firstOrder = firstPlan.sortOrder
      ?? preferredOrder.get(normalizePlanKey(firstPlan.code))
      ?? preferredOrder.get(normalizePlanKey(firstPlan.name))
      ?? 99;
    const secondOrder = secondPlan.sortOrder
      ?? preferredOrder.get(normalizePlanKey(secondPlan.code))
      ?? preferredOrder.get(normalizePlanKey(secondPlan.name))
      ?? 99;

    return firstOrder - secondOrder;
  });
}

export function normalizePlanOffer(plan = {}) {
  const normalizedKeys = [
    normalizePlanKey(plan.id),
    normalizePlanKey(plan.code),
    normalizePlanKey(plan.name),
  ];

  const shouldNormalizeToPro = normalizedKeys.some((key) => (
    key === "advanced" || key === "premium"
  ));

  if (!shouldNormalizeToPro) {
    return plan;
  }

  const proPlan = defaultPlans.find((defaultPlan) => defaultPlan.id === "pro");

  return {
    ...plan,
    ...proPlan,
    id: plan.id || proPlan.id,
  };
}

export function addMissingDefaultPlans(plans = []) {
  const normalizedPlans = plans.map(normalizePlanOffer);
  const existingKeys = new Set(
    normalizedPlans.flatMap((plan) => [
      normalizePlanKey(plan.id),
      normalizePlanKey(plan.code),
      normalizePlanKey(plan.name),
    ])
  );

  const missingDefaultPlans = defaultPlans.filter((plan) => (
    !existingKeys.has(normalizePlanKey(plan.id))
    && !existingKeys.has(normalizePlanKey(plan.code))
    && !existingKeys.has(normalizePlanKey(plan.name))
  ));

  return orderPlans([
    ...normalizedPlans,
    ...missingDefaultPlans,
  ]);
}

export function getDefaultPlanById(planId) {
  const normalizedPlanId = normalizePlanKey(planId);
  const legacyProAliases = new Set(["advanced", "premium"]);

  return defaultPlans.find((plan) => (
    normalizePlanKey(plan.id) === normalizedPlanId
    || normalizePlanKey(plan.code) === normalizedPlanId
    || normalizePlanKey(plan.name) === normalizedPlanId
  )) || (legacyProAliases.has(normalizedPlanId)
    ? defaultPlans.find((plan) => plan.id === "pro")
    : null);
}
