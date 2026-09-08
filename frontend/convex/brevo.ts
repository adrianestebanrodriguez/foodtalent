// Brevo (Sendinblue) email provider for Convex Auth password reset.
// Reads AUTH_BREVO_API_KEY and AUTH_BREVO_FROM from the Convex environment.
export default function Brevo(config: any) {
  return {
    id: "brevo",
    type: "email" as const,
    name: "Brevo",
    from: process.env.AUTH_BREVO_FROM ?? "FoodTalent <adrianalvarezr@gmail.com>",
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest(params: any) {
      const { identifier: to, provider, url, token } = params;
      const { host } = new URL(url);
      const match = /<([^>]+)>/.exec(provider.from);
      const senderEmail = match ? match[1] : provider.from;
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": provider.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: "FoodTalent" },
          to: [{ email: to }],
          subject: `Recupera tu contraseña en ${host}`,
          htmlContent:
            `<div style="font-family:sans-serif;max-width:480px;margin:auto">` +
            `<h2>Recupera tu contraseña en FoodTalent</h2>` +
            `<p>Tu código de verificación es:</p>` +
            `<p style="font-size:32px;letter-spacing:6px;font-weight:bold">${token}</p>` +
            `<p>Ingresa este código junto con tu nueva contraseña en la página de restablecimiento.</p>` +
            `<p>Si no solicitaste este cambio, ignora este mensaje.</p>` +
            `</div>`,
          textContent: `Tu codigo de verificacion en ${host} es: ${token}`,
        }),
      });
      if (!res.ok)
        throw new Error("Brevo error: " + JSON.stringify(await res.json()));
    },
    options: config,
  };
}