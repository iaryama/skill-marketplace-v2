import { Model, DataTypes } from "sequelize";
import { sequelize } from "../utils/connectPostgres";
// Define Packages model
export class Packages extends Model {}

Packages.init(
  {
    package_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
    package_name: DataTypes.STRING,
    owner: DataTypes.STRING,
    ticker: { type: DataTypes.STRING, unique: true },
    package_tagline: DataTypes.TEXT,
    is_accomodation_included: DataTypes.BOOLEAN,
    duration: DataTypes.INTEGER.UNSIGNED,
    city: { type: DataTypes.STRING, allowNull: false },
    main_temple: DataTypes.TEXT,
    pricing: DataTypes.JSONB,
    package_type: DataTypes.STRING,
    places_covered: DataTypes.TEXT,
    itinerary: DataTypes.TEXT,
    inclusions: DataTypes.TEXT,
    exclusions: DataTypes.TEXT,
    darshan_ids: DataTypes.ARRAY(DataTypes.BIGINT),
  },
  { sequelize, modelName: "packages", tableName: "packages", timestamps: true }
);
