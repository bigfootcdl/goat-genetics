// Sends email through Resend when RESEND_API_KEY is set; otherwise logs it.
export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
    return { sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Goat Genetics <no-reply@example.com>",
        to,
        subject,
        text,
      }),
    });
    if (!res.ok) console.error("[email] failed", res.status, await res.text());
    return { sent: res.ok };
  } catch (e) {
    console.error("[email] failed", e);
    return { sent: false };
  }
}
