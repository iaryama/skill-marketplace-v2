import sgMail from "@sendgrid/mail";
import { getCurrentISTDateTime } from "../helpers/miscellaneous";
import { SENDGRID_API_KEY } from "./constants";
interface SendGridMessage {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (msg: SendGridMessage) => {
  sgMail.setApiKey(SENDGRID_API_KEY);
  try {
    await sgMail.send(msg);
  } catch (err: any) {
    if (err.response) {
      console.error(getCurrentISTDateTime() + ":", err.response.body);
    } else {
      console.error(getCurrentISTDateTime() + ":", err);
    }
    throw err;
  }
};
