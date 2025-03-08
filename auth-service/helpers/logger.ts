import { Log } from "./constants";
export function logPrefix(LogLevel: Log) {
  const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
  const [month, day, year] = date.split(",")[0].split("/");
  const [time] = date.split(", ")[1].split(" ");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time} [${LogLevel}]`;
}
