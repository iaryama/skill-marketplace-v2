import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { Category } from './category';
import { Currency } from '../helpers/constants';

class Task extends Model {
  public id!: number;
  public task_name!: string;
  public category_id!: number;
  public user_id!: number;
  public description!: string;
  public start_date!: Date;
  public no_of_working_hours!: number;
  public hourly_rate!: number;
  public progress!: string;
  public status!: string;
  public currency!: Currency;
}

Task.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    task_name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    start_date: { type: DataTypes.DATE, allowNull: false },
    no_of_working_hours: { type: DataTypes.INTEGER, allowNull: false },
    hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.STRING },
    currency: { type: DataTypes.ENUM({ values: Object.values(Currency) }), allowNull: false },
    progress: { type: DataTypes.STRING },
    category_id: { type: DataTypes.INTEGER, references: { model: Category, key: 'id' } },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Task', tableName: 'tasks', schema: 'tasks', timestamps: true },
);

// Define association with Category
Task.belongsTo(Category, { foreignKey: 'category_id' });

export { Task };
