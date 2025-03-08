import cryp from "crypto";
import axios from "axios";
import {
  NTT_PAYMENT_AUTH_URL,
  NTT_PAYMENT_DECRYPTION_KEY,
  NTT_PAYMENT_ENCRYPTION_KEY,
  NTT_PAYMENT_MERCH_PASSWORD,
  NTT_PAYMENT_PROD_ID,
  NTT_PAYMENT_MERCH_ID,
  NTT_PAYMENT_REQ_SALT,
  NTT_PAYMENT_RES_SALT,
} from "../utils/constants";

const reqEncryptionKey = NTT_PAYMENT_ENCRYPTION_KEY as string;
const reqSalt = NTT_PAYMENT_REQ_SALT as string;
const resDecryptionKey = NTT_PAYMENT_DECRYPTION_KEY as string;
const resSalt = NTT_PAYMENT_RES_SALT as string;

const Authurl = NTT_PAYMENT_AUTH_URL as string;
const merchId = NTT_PAYMENT_MERCH_ID as string;
const merchPass = NTT_PAYMENT_MERCH_PASSWORD as string;
const [APTDC_PRODUCT_ID, BMD_PRODUCT_ID] = (NTT_PAYMENT_PROD_ID as string).split(",");

const algorithm = "aes-256-cbc";
const password = Buffer.from(reqEncryptionKey, "utf8");
const salt = Buffer.from(reqSalt, "utf8");
const respassword = Buffer.from(resDecryptionKey, "utf8");
const ressalt = Buffer.from(resSalt, "utf8");
const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as any, "utf8");

const encrypt = (text: any) => {
  const derivedKey = cryp.pbkdf2Sync(password, salt, 65536, 32, "sha512");
  const cipher = cryp.createCipheriv(algorithm, derivedKey, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${encrypted.toString("hex")}`;
};

export const decrypt = (text: any) => {
  const encryptedText = Buffer.from(text, "hex");
  const derivedKey = cryp.pbkdf2Sync(respassword, ressalt, 65536, 32, "sha512");
  const decipher = cryp.createDecipheriv(algorithm, derivedKey, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export async function generateNTTPaymentPayload(
  amount: number,
  isBMD: boolean,
  email: string,
  phoneNo: string
): Promise<any> {
  const txnId = "Invoice" + new Date().getTime().toString(36);
  const txnDate = new Date().toISOString().slice(0, 19).replace("T", " ");
  const prodId = isBMD ? BMD_PRODUCT_ID : APTDC_PRODUCT_ID;
  const jsondata =
    '{"payInstrument":{"headDetails":{"version":"OTSv1.1","api":"AUTH","platform":"FLASH"},"merchDetails":{"merchId":"' +
    merchId +
    '","userId":"","password":"' +
    merchPass +
    '","merchTxnId":"' +
    txnId +
    '","merchTxnDate":"' +
    txnDate +
    '"},"payDetails":{"amount":"' +
    amount +
    '","product":"' +
    prodId +
    '","custAccNo":"213232323","txnCurrency":"INR"},"custDetails":{"custEmail":"' +
    email +
    '","custMobile":"' +
    phoneNo +
    '"},  "extras": {"udf1":"udf1","udf2":"udf2","udf3":"udf3","udf4":"udf4","udf5":"udf5"}}}';

  const JSONString = jsondata.toString();
  const encDataR = encrypt(JSONString);

  const response = await axios.post(
    Authurl,
    {
      encData: encDataR,
      merchId,
    },
    {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const responseIsEmpty: boolean = !response.data || response.data.length === 0;
  if (responseIsEmpty) {
    throw new Error("The response from NTT payment gateway is an empty string data");
  }
  const datas = response.data;
  const arr = datas.split("&");
  const arrTwo = arr[1].split("=");
  const decryptedData = decrypt(arrTwo[1]);
  const jsonData = JSON.parse(decryptedData);
  const respArray = Object.keys(jsonData).map((key) => jsonData[key]);
  // Check if txnStatusCodeis  OTS0000 at any index in the array
  if (respArray.find((element) => element.txnStatusCode === "OTS0000")) {
    return respArray[0];
  } else {
    throw new Error("Error in NTT PG response");
  }
}
