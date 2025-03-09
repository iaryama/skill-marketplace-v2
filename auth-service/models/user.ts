import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';

class User extends Model {
  public id!: number;
  public providerType!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public passwordHash!: string;
  public companyName?: string;
  public role!: string;
  public businessTaxNumber?: string;
  public mobileNumber!: string;
  public streetNumber?: string;
  public streetName?: string;
  public city?: string;
  public state?: string;
  public postCode?: string;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    providerType: { type: DataTypes.ENUM('individual', 'company'), allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    companyName: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('contractor', 'client'), allowNull: false, defaultValue: 'contractor' },
    businessTaxNumber: { type: DataTypes.STRING, allowNull: true },
    mobileNumber: { type: DataTypes.STRING, allowNull: false },
    streetNumber: { type: DataTypes.STRING, allowNull: true },
    streetName: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    postCode: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    schema: 'auth',
    timestamps: true,
  },
);

export { User };
