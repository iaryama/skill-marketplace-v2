import { Log } from "./constants";

const formatDate = (): string => {
  const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
  const [month, day, year] = date.split(",")[0].split("/");
  const [time] = date.split(", ")[1].split(" ");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;
};

const logPrefix = (logLevel: Log): string => `${formatDate()} [${logLevel}]`;

const logWithPrefix = (logLevel: Log, ...messages: any[]): void => {
  const prefix = logPrefix(logLevel);
  console.log(prefix, ...messages);
};

export const Logger = {
  INFO: (...messages: any[]) => logWithPrefix(Log.INFO, ...messages),
  DEBUG: (...messages: any[]) => logWithPrefix(Log.DEBUG, ...messages),
  WARN: (...messages: any[]) => logWithPrefix(Log.WARN, ...messages),
  ERROR: (...messages: any[]) => logWithPrefix(Log.ERROR, ...messages),
};