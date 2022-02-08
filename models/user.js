const {Model, DataTypes} = require('sequelize');
const md5 = require('md5');
const db = require("../config/pool");
const Roles = require("./roles");

class Users extends Model {

  static passwordHash(pass) {
    return md5(md5(pass + '_ha-ba'))
  }
}

Users.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'phone',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: 'email',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    set(val) {
      this.setDataValue('password', Users.passwordHash(val))
    },
    get() {
      return undefined;
    }
  },
  verifyId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  checked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  restoreVerifyId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verifyLevel: {
    type: DataTypes.ENUM('0', '1', '2', '3'),
    allowNull: false,
    defaultValue: '0',
  },
  active: {
    type: DataTypes.ENUM('on', 'off'),
    allowNull: true,
    defaultValue: 'off',
  },
  lastVisit: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize: db,
  tableName: 'users',
  modelName: 'users',
  paranoid: true,
});

Users.belongsTo(Users, {
  foreignKey: {
    name: 'invitor',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'set null',
  as: 'invite',
});
Users.hasMany(Users, {
  foreignKey: {
    name: 'invitor',
    allowNull: true,
  },
  onUpdate: 'cascade',
  onDelete: 'set null',
  as: 'userInvitor'
});

Users.belongsTo(Roles, {
  foreignKey: {
    name: 'role',
    allowNull: true,
    defaultValue: 4,
  },
  onUpdate: 'set null',
  onDelete: 'set null',
  as: 'roles',
});
Roles.hasMany(Users, {
  foreignKey: {
    name: 'role',
    allowNull: true,
    defaultValue: 4,
  },
  onUpdate: 'set null',
  onDelete: 'set null',
  as: 'userRoles'
});

module.exports = Users;
