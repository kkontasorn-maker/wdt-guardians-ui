/**
 * Soft Launch mail helper.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs and reports not-sent.
 */

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  ok: boolean;
  mode: "resend" | "log";
  id?: string;
  error?: string;
};

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() ||
    "WDT Guardians Soft Launch <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[mail:log]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true, mode: "log" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<pre style="font-family:system-ui,sans-serif">${escapeHtml(input.text)}</pre>`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };
    if (!res.ok) {
      console.warn("[mail:resend] failed", res.status, data);
      return {
        ok: false,
        mode: "resend",
        error: data.message ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, mode: "resend", id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    console.warn("[mail:resend] error", message);
    return { ok: false, mode: "resend", error: message };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function adminInviteEmail(opts: {
  to: string;
  name: string;
  tempPassword: string;
  mustChangePassword: boolean;
  appUrl: string;
}): SendMailInput {
  const lines = [
    `Hello ${opts.name || opts.to},`,
    "",
    "You have been added as a Soft Launch admin user for WDT Guardians.",
    "",
    `Sign in: ${opts.appUrl.replace(/\/$/, "")}/admin/login`,
    `Email: ${opts.to}`,
    `Temporary password: ${opts.tempPassword}`,
    "",
    opts.mustChangePassword
      ? "You will be asked to choose a new password at the next sign-in."
      : "You can change your password any time from the admin console after signing in.",
    "",
    "— WDT Guardians Soft Launch",
  ];
  return {
    to: opts.to,
    subject: "WDT Guardians admin access",
    text: lines.join("\n"),
  };
}

export function adminPasswordResetEmail(opts: {
  to: string;
  name: string;
  tempPassword: string;
  appUrl: string;
}): SendMailInput {
  const lines = [
    `Hello ${opts.name || opts.to},`,
    "",
    "An administrator asked you to change your WDT Guardians Soft Launch admin password.",
    "",
    `Sign in: ${opts.appUrl.replace(/\/$/, "")}/admin/login`,
    `Email: ${opts.to}`,
    `Temporary password: ${opts.tempPassword}`,
    "",
    "You must choose a new password at the next sign-in.",
    "",
    "— WDT Guardians Soft Launch",
  ];
  return {
    to: opts.to,
    subject: "WDT Guardians admin password change required",
    text: lines.join("\n"),
  };
}

/** Soft Launch welcome / Guardian ID notice (Resend or log stub). */
export function welcomeGuardianEmail(opts: {
  to: string;
  firstName: string;
  guardianId: string;
  planLabel: string;
  appUrl: string;
}): SendMailInput {
  const base = opts.appUrl.replace(/\/$/, "");
  const lines = [
    `Hello ${opts.firstName || "Guardian"},`,
    "",
    "Welcome to WDT Guardians Soft Launch.",
    "",
    `Guardian ID: ${opts.guardianId}`,
    `Plan: ${opts.planLabel}`,
    "",
    `Member portal: ${base}/manage/login`,
    "Sign in with your Guardian ID and the same email you used when joining (no password).",
    "",
    "Soft Launch charges the amount due at join. Later periods are not auto-debited yet.",
    "",
    "— Watchdog Thailand Foundation · WDT Guardians",
  ];
  return {
    to: opts.to,
    subject: `Your WDT Guardian ID: ${opts.guardianId}`,
    text: lines.join("\n"),
  };
}

/** Fire-and-forget welcome mail; never throws to callers. */
export async function sendWelcomeGuardianEmail(opts: {
  to: string;
  firstName: string;
  guardianId: string;
  planLabel: string;
  appUrl?: string;
}): Promise<SendMailResult> {
  const appUrl =
    opts.appUrl?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://wdt-guardians-ui.vercel.app";
  try {
    return await sendMail(
      welcomeGuardianEmail({
        to: opts.to,
        firstName: opts.firstName,
        guardianId: opts.guardianId,
        planLabel: opts.planLabel,
        appUrl,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "welcome send failed";
    console.warn("[mail:welcome]", message);
    return { ok: false, mode: "log", error: message };
  }
}
