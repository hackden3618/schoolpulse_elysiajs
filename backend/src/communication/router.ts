import { Elysia } from "elysia"

const credentials = {
    apiKey: process.env.AFRICASTALKING_API,
    username: process.env.AFRICASTALKING_USERNAME
}
const Africastalking = require("africastalking")(credentials);
const sms = Africastalking.SMS;

// for sending sms
const app = new Elysia();
export const communicationRoute = app;
// for reading sms, maybe from the database
app.get("/sms", "hi, you are at the sms route")

app.post("/sms", async ({ set, body }: any) => {
    const { recipients, message } = body
    const options = {
        to: recipients,
        message: message,
        // from: "SchoolPulse"
    }
    try {
        await sms
            .send(options)
            .then((response: any) => {
                set.status = 201
                const recipients = response.SMSMessageData.Recipients;
                // console.log(recipients[0]);

                const recipientNo = recipients[0].number;
                console.log("message sent successfully ", response.SMSMessageData, recipientNo)
                return {
                    message: "message sent successfully",
                    body: response
                }
            })
            .catch((error: any) => {
                console.log("message failed to send ", error)
                set.status = 400
                const { phoneNumber, failureReason, id, status } = error
                return {
                    phoneNumber,
                    status,
                }
            });
        set.status = 201
    } catch (error: any) {
        set.status = 500
        return error
    }
})

// for message receipts
app.post("/delivery", async ({ set, body }: any) => {
    set.status = 201;
    console.log("message delivery", body);
    return {
        status: "delivered",
        message: "Message delivered successfully",
        body
    }
})


// for incoming message 
// app.post("/inbox", async ({ set, body }: any) => {
//     set.status = 201;
//     console.log("new message inbox: ", body.text);
//     await sms.send({
//         to: body.from, message: body.text, from: "1783"
//     })
//         .then((response: any) => {
//             set.status = 201
//             console.log("message sent successfully ", response.SMSMessageData)
//             return {
//                 message: "message sent successfully",
//                 body: response
//             }
//         })
//         .catch((error: any) => {
//             console.log("message failed to send ", error)
//             set.status = 400
//             return {
//                 error
//             }
//         });
//     set.status = 201
//     console.log("sent: ");
//
//     return {
//         message: "New Message received",
//         body
//     }
// })
