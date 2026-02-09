import express from 'express';
import twilio from 'twilio';

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

console.log('Twilio Config:', {
  accountSid: accountSid ? 'SET' : 'NOT SET',
  authToken: authToken ? 'SET' : 'NOT SET',
  whatsappNumber,
});

const client = twilio(accountSid, authToken);

router.post('/send-whatsapp', async (req, res) => {
  try {
    console.log('Raw JSON data:', req.body); // Debugging log
    const parsedData = JSON.parse(req.body);
    console.log('Parsed JSON data:', parsedData); // Debugging log
  } catch (error) {
    console.error('JSON parsing error:', error);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }

  const { to, message } = req.body;

  console.log('Request body:', req.body); // Debugging log

  if (!to || !message) {
    console.error('Missing required fields:', { to, message });
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }

  console.log('Twilio API Request:', {
    from: `whatsapp:${whatsappNumber}`,
    to: `whatsapp:${to}`,
    body: message,
  });

  try {
    const response = await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log('Twilio API response:', response); // Debugging log

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

    if (error.code) {
      res.status(500).json({ error: `Twilio API error: ${error.message}`, code: error.code });
    } else {
      res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
  }
});

export default router;