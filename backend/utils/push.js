const axios = require("axios");

/**
 * Send Expo push notifications via HTTP.
 * This uses Expo's push service: https://docs.expo.dev/push-notifications/sending-notifications/
 */
async function sendPushAsync({ to, title, body, data }) {
  if (!to) return null;

  const tokens = (Array.isArray(to) ? to : [to]).filter(
    (t) => typeof t === "string" && t.startsWith("ExponentPushToken")
  );
  if (tokens.length === 0) return null;

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      messages,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch (err) {
    console.warn("Expo push send failed:", err.message);
    return null;
  }
}

module.exports = {
  sendPushAsync,
};

