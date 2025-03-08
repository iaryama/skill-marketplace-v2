import admin, { ServiceAccount } from "firebase-admin";
import { NODE_ENV } from "./constants";

// Initialize Firebase Admin SDK
import serviceAccount from "../firebase-adminsdk.json" assert { type: "json" };
type ENVIRONMENT = "PRODUCTION" | "DEVELOPMENT" | "STAGING";
const env = NODE_ENV as ENVIRONMENT;
const firebaseServiceAccount: ServiceAccount = serviceAccount[env] as ServiceAccount;
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount),
  databaseURL: "https://" + serviceAccount[env].project_id + ".firebaseio.com",
});

const db = firebaseApp.firestore();
db.settings({ ignoreUndefinedProperties: true });
export { db };
