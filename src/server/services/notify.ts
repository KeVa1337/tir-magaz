import "server-only";

/**
 * Сповіщення. У демо — тільки лог у консоль сервера.
 * 🟡 Пізніше: SMTP/Resend для email, Telegram-бот, SMS (TurboSMS тощо).
 */
export async function sendEmail(to: string | null | undefined, subject: string, text: string) {
  if (!to) return;
  console.info(`[notify:email] → ${to}: ${subject}\n${text}`);
}
