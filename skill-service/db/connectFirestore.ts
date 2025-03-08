import admin, { ServiceAccount } from "firebase-admin";

// Initialize Firebase Admin SDK
import serviceAccount from "../firebase-adminsdk.json" assert { type: "json" };

const firebaseServiceAccount: ServiceAccount = serviceAccount as ServiceAccount;
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount),
  databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com",
});

const db = firebaseApp.firestore();
db.settings({ ignoreUndefinedProperties: true });
export { db };
