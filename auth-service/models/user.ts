import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres'

class User extends Model {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public role!: string;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'contractor' },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    schema: 'auth',
    timestamps: true,
  }
);

export { User };
