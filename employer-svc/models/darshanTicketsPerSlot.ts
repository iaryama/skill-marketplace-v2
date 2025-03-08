import { Model, DataTypes } from "sequelize";
import { sequelize } from "../utils/connectPostgres";

export class BMDTemples extends Model {}
BMDTemples.init(
  {
    temple_name: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.TEXT, allowNull: false },
    temple_id: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false, autoIncrement: true },
  },
  { sequelize, modelName: "bmdTemples", tableName: "bmd_temples" }
);

export class BMDTemplesDarshans extends Model {}
BMDTemplesDarshans.init(
  {
    temple_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: "unique_temple_darshan", // Same group for composite unique constraint
    },
    darshan_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    darshan_name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "unique_temple_darshan", // Same group for composite unique constraint
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "bmdTemplesDarshans",
    tableName: "bmd_temple_darshans",
  }
);

export class BMDTemplesDarshanSlots extends Model {}
BMDTemplesDarshanSlots.init(
  {
    darshan_id: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false },
    darshan_time: { type: DataTypes.TIME, allowNull: false, primaryKey: true },
    no_of_tickets: { type: DataTypes.INTEGER },
  },
  { sequelize, modelName: "bmdTemplesDarshanSlots", tableName: "bmd_temple_darshan_slots" }
);

export class BMDTemplesDarshanDates extends Model {}
BMDTemplesDarshanDates.init(
  {
    darshan_id: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false },
    darshan_time: { type: DataTypes.TIME, allowNull: false, primaryKey: true },
    date: { type: DataTypes.DATEONLY, allowNull: false, primaryKey: true },
    no_of_tickets: { type: DataTypes.INTEGER },
  },
  { sequelize, modelName: "bmdTemplesDarshanDates", tableName: "bmd_temple_darshan_dates" }
);
