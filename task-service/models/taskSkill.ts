import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';

class TaskSkill extends Model {
  public taskId!: number;
  public skillId!: number;
}

TaskSkill.init(
  {
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    skillId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'skills',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'TaskSkill',
    tableName: 'skills_tasks',
    timestamps: false,
  },
);

export { TaskSkill };
