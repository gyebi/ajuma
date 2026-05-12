const SUPPORT_SMS_BODY = "Hi Ajuma AI, I need help.";
const SUPPORT_SMS_NUMBER = "+13323230435";

export default function FloatingSmsBubble() {
  const smsHref = `sms:${SUPPORT_SMS_NUMBER}?body=${encodeURIComponent(SUPPORT_SMS_BODY)}`;

  return (
    <a className="sms-help-bubble" href={smsHref} aria-label="Text Ajuma AI for help">
      <span className="sms-help-label">Need Help?</span>
    </a>
  );
}
