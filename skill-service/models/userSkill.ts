import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/connectPostgres';
import { User } from './user';
import { Skill } from './skill';

class UserSkill extends Model {
  public userId!: number;
  public skillId!: number;
}

UserSkill.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    modelName: 'UserSkill',
    tableName: 'user_skills',
    schema: 'skills',
    timestamps: false,
  },
);

// Define associations
User.belongsToMany(Skill, { through: UserSkill, foreignKey: 'userId' });
Skill.belongsToMany(User, { through: UserSkill, foreignKey: 'skillId' });

export { UserSkill };
