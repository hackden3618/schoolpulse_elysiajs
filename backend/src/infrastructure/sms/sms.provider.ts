const credentials = {
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Africastalking = require("africastalking")(credentials);
export const sms = Africastalking.SMS;
