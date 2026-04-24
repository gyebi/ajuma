import { useEffect, useState } from "react";
import { fetchMyEntitlement, verifyPayment } from "../services/paymentApi";

export default function PaymentCallback() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your payment...");
  const [payment, setPayment] = useState(null);
  const [entitlement, setEntitlement] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function handleCallback() {
      const searchParams = new URLSearchParams(window.location.search);
      const reference = searchParams.get("reference") || searchParams.get("trxref");

      if (!reference) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage("Payment reference is missing from the callback URL.");
        return;
      }

      try {
        const verification = await verifyPayment(reference);

        if (!isMounted) {
          return;
        }

        setPayment(verification.payment || null);
        setEntitlement(verification.entitlement || null);
        setStatus("success");
        setMessage("Payment verified successfully.");

        try {
          const entitlementResponse = await fetchMyEntitlement();

          if (isMounted) {
            setEntitlement(entitlementResponse.entitlement || verification.entitlement || null);
          }
        } catch (_error) {
          // Keep the verification result even if the follow-up entitlement fetch fails.
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage(error.message || "Unable to verify payment.");
      }
    }

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="app-main">
      <section className="panel">
        <p className="section-label section-label-workflow">Payment Callback</p>
        <h1 className="app-shell-title">
          {status === "loading" ? "Confirming payment" : status === "success" ? "Payment confirmed" : "Payment check failed"}
        </h1>
        <p>{message}</p>

        {payment ? (
          <div>
            <p><strong>Reference:</strong> {payment.reference}</p>
            <p><strong>Status:</strong> {payment.status}</p>
            <p><strong>Credits Granted:</strong> {payment.creditsGranted ?? 0}</p>
          </div>
        ) : null}

        {entitlement ? (
          <div>
            <p><strong>Available Credits:</strong> {entitlement.availableCredits ?? 0}</p>
            <p><strong>Total Credits:</strong> {entitlement.totalCredits ?? 0}</p>
          </div>
        ) : null}

        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            window.location.assign("/");
          }}
        >
          Return to app
        </button>
      </section>
    </main>
  );
}
