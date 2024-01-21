const twilio = require("twilio");
const config = require('../config/config');


class TwilioService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.serviceSid = config.twilio.smsServiceID;
  }

  // Function to send OTP to a phone number
  async sendOTP(name,phoneNumber, otp) {
    try {
       await this.client.messages.create({
        to: phoneNumber,
        messagingServiceSid: this.serviceSid,
        body: `Dear ${name} Your OTP for registration is: ${otp}`,
      });

      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return false;
    }
  }
}

module.exports = TwilioService;
