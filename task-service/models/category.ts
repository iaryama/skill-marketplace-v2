import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';

class Category extends Model {
  public id!: number;
  public name!: string;
}

Category.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    schema: 'tasks',
    timestamps: true,
  },
);

export { Category };
