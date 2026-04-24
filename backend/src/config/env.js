function stripWrappingQuotes(value = "") {
  return value.replace(/^['"]|['"]$/g, "");
}

export const env = {
  PORT: Number(process.env.PORT || 3001),
  PAYSTACK_SECRET_KEY: stripWrappingQuotes(process.env.PAYSTACK_SECRET_KEY || ""),
  PAYSTACK_CALLBACK_URL: stripWrappingQuotes(process.env.PAYSTACK_CALLBACK_URL || ""),
};
