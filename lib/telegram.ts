export async function sendTelegramMessage(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram environment variables are missing");
    return;
  }

  const url =
    "https://api.telegram.org/bot" +
    token +
    "/sendMessage";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    const result = await response.json();

    console.log("TELEGRAM RESPONSE:", result);

    if (!result.ok) {
      console.error("TELEGRAM ERROR:", result);
    }
  } catch (error) {
    console.error("TELEGRAM FETCH ERROR:", error);
  }
}