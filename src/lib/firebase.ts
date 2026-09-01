import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { safeJSONStringify } from "./utils";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Set Firestore log level to silent to suppress benign offline warnings in iframe/sandboxed previews
try {
  setLogLevel("silent");
} catch (_) {}

const apps = getApps();
const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];

const dbId =
  !firebaseConfig.firestoreDatabaseId ||
  firebaseConfig.firestoreDatabaseId === "(default)"
    ? undefined
    : firebaseConfig.firestoreDatabaseId;

// Use a global singleton pattern to prevent multiple Firestore instances during HMR
const dbIdToUse = dbId || "(default)";
let dbInstance;

try {
  // @ts-ignore
  if (!globalThis._firebase_db) {
    try {
      dbInstance = initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        dbIdToUse === "(default)" ? undefined : dbIdToUse,
      );
    } catch (_) {
      dbInstance = initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        dbIdToUse === "(default)" ? undefined : dbIdToUse,
      );
    }

    // @ts-ignore
    globalThis._firebase_db = dbInstance;
  } else {
    // @ts-ignore
    dbInstance = globalThis._firebase_db;
  }
} catch (e) {
  console.warn(
    "Firestore singleton initialization error, falling back to getFirestore:",
    e,
  );
  dbInstance = getFirestore(app, dbIdToUse === "(default)" ? undefined : dbIdToUse);
}

export const db = dbInstance;
export const auth = getAuth(app);

console.log(
  `🔥 Firestore: Inicializando com Database ID: ${dbId || "(default)"}`,
);

// Removing early testConnection to prevent race conditions during initialization

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null = null,
): void {
  const rawErrorMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || "";
  const errStrLower = rawErrorMsg.toLowerCase();

  const errInfo: FirestoreErrorInfo = {
    error: rawErrorMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (
    errCode === "resource-exhausted" ||
    errCode === "unavailable" ||
    errStrLower.includes("quota") ||
    errStrLower.includes("resource_exhausted") ||
    errStrLower.includes("resource-exhausted") ||
    errStrLower.includes("offline") ||
    errStrLower.includes("could not reach cloud firestore backend") ||
    errStrLower.includes("backend didn't respond")
  ) {
    console.warn("🔥 Firestore (Offline/Quota):", rawErrorMsg);
    return;
  }

  let safeErrStr = rawErrorMsg;
  try {
    safeErrStr = safeJSONStringify(errInfo);
  } catch (e) {
    safeErrStr = String(rawErrorMsg);
  }

  console.error("🔥 Firestore Error:", safeErrStr);
  throw new Error(safeErrStr);
}
