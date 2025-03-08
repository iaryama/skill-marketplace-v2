import { Model, DataTypes } from "sequelize";
import { sequelize } from "../utils/connectPostgres";
// Define BookingIdGenerator model
export class BookingIdGenerator extends Model {}
BookingIdGenerator.init(
  {
    date: { type: DataTypes.DATEONLY, primaryKey: true, allowNull: false },
    ticker: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    currentDateSequence: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: "bookingIdGenerator",
    tableName: "bookingIdGenerator",
    timestamps: true,
  }
);
