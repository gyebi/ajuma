export function normalizePlanKey(value = "") {
  return String(value).trim().toLowerCase();
}

export function resolvePlanAmount(plan = {}) {
  return (
    plan.amount
    ?? plan.priceAmount
    ?? plan.priceValue
    ?? plan.price
    ?? null
  );
}

export function resolvePlanCredits(plan = {}) {
  const credits = Number(
    plan.credits
    ?? plan.creditAmount
    ?? plan.creditCount
    ?? 0
  );

  return Number.isFinite(credits) && credits > 0 ? credits : 0;
}

export function formatPlanPrice(plan = {}) {
  const amount = resolvePlanAmount(plan);
  const currency = plan.currency || "GHS";
  const numericAmount = Number(amount);

  if (Number.isFinite(numericAmount)) {
    const hasCents = !Number.isInteger(numericAmount);

    return `${currency} ${numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0
    })}`;
  }

  return amount ? `${currency} ${amount}` : "Price unavailable";
}

export function getPlanCreditsLabel(plan = {}) {
  const credits = resolvePlanCredits(plan);

  return credits ? `${credits} applications` : "Applications unavailable";
}

export function buildPlanFeatures(plan = {}, marketingFeatures = []) {
  const creditsLabel = getPlanCreditsLabel(plan);
  const nonCreditFeatures = marketingFeatures.filter((feature) => (
    !/application|credit/i.test(feature)
  ));

  return [
    creditsLabel,
    ...nonCreditFeatures
  ];
}
