const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

exports.sendWhatsAppNotification = async (studentNumbers, message) => {
  try {
    const responses = await Promise.all(
      studentNumbers.map(async number => {
        const formattedNumber = `whatsapp:+91${number}`;
        const result = await client.messages.create({
          from: 'whatsapp:+14155238886', // Twilio sandbox number
          to: formattedNumber,
          body: message
        });
        return { number, status: result.status };
      })
    );
    return responses;
  } catch (error) {
    console.error('Error sending WhatsApp notifications:', error);
    throw error;
  }
};
