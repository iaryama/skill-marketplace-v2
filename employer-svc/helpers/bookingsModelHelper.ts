import { BookingIdGenerator } from "../models/bookingIdGenerator";
import { sequelize } from "../utils/connectPostgres";
import { todaysDate, months } from "./miscellaneous";

export async function generateBookingId(ticker: string) {
  const currentDate = todaysDate();
  const [year, month, dd] = currentDate.split("-");
  const transaction = await sequelize.transaction();
  try {
    // Find the latest sequence number for the current date within the transaction
    const latestId = await BookingIdGenerator.findOne({
      where: {
        date: currentDate,
        ticker,
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    const sequence = latestId ? latestId.getDataValue("currentDateSequence") : 0;
    const nextSequence = sequence + 1;
    const formattedDateForId = `${dd}-${months[Number(month) - 1]}-${year}`;
    const bookingId = `BMD-${ticker}-${formattedDateForId}-${nextSequence}`;
    // Create a new date sequence
    await BookingIdGenerator.upsert(
      { date: currentDate, ticker, currentDateSequence: nextSequence },
      { transaction, fields: ["date", "ticker", "currentDateSequence"] }
    );
    await transaction.commit();
    return bookingId;
  } catch (error: any) {
    await transaction.rollback();
    throw error;
  }
}
