const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeatPricing = sequelize.define('SeatPricing', {
  seatClass: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Add this line to define a unique constraint
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

module.exports = SeatPricing;
