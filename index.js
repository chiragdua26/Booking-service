 
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

// Create an instance of Express.js
const app = express();
app.use(express.json());

// Connect to the PostgreSQL database
const sequelize = new Sequelize('booking_service', 'postgres', 'Divine359@', {
  host: 'localhost',
  dialect: 'postgres',
});

// Define the Seat and SeatPricing models
const Seat = sequelize.define('Seat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  seatClass: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isBooked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

const SeatPricing = sequelize.define('SeatPricing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  seatClass: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  minPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  maxPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  normalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

// Define the associations between Seat and SeatPricing
SeatPricing.hasMany(Seat, { foreignKey: 'seatClass', sourceKey: 'seatClass' });
Seat.belongsTo(SeatPricing, { foreignKey: 'seatClass', targetKey: 'seatClass' });

// Set up the API routes
app.get('/seats', async (req, res) => {
  try {
    const seats = await Seat.findAll({
      order: [['seatClass', 'ASC']],
    });

    res.json(seats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/seats/:id', async (req, res) => {
  const seatId = req.params.id;

  try {
    const seat = await Seat.findByPk(seatId, { include: SeatPricing });
    if (!seat) {
      res.status(404).json({ error: 'Seat not found' });
      return;
    }

    const seatPricing = seat.SeatPricing;

    // Calculate the percentage of seats booked for the seat class
    const totalSeatsOfClass = await Seat.count({
      where: { seatClass: seatPricing.seatClass },
    });

    const totalBookedSeatsOfClass = await Seat.count({
      where: { seatClass: seatPricing.seatClass, isBooked: true },
    });

    const percentageBooked = (totalBookedSeatsOfClass / totalSeatsOfClass) * 100;

    // Determine the pricing based on the percentage booked
    let pricing;
    if (percentageBooked < 40) {
      pricing = seatPricing.minPrice;
    } else if (percentageBooked >= 40 && percentageBooked < 60) {
      pricing = seatPricing.normalPrice;
    } else {
      pricing = seatPricing.maxPrice;
    }

    res.json({ seat, pricing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/booking', async (req, res) => {
  const { seatIds, name, phoneNumber } = req.body;

  try {
    const seats = await Seat.findAll({ where: { id: seatIds } });

    // Check if any of the chosen seats are already booked
    const alreadyBookedSeats = seats.filter((seat) => seat.isBooked);
    if (alreadyBookedSeats.length > 0) {
      res.status(400).json({ error: 'Some seats are already booked' });
      return;
    }

    // Calculate the total amount of the booking
    let totalAmount = 0;
    for (const seat of seats) {
      const seatPricing = await SeatPricing.findOne({ where: { seatClass: seat.seatClass } });

      // Determine the pricing based on the percentage booked
      const totalSeatsOfClass = await Seat.count({ where: { seatClass: seat.seatClass } });
      const totalBookedSeatsOfClass = await Seat.count({
        where: { seatClass: seat.seatClass, isBooked: true },
      });

      const percentageBooked = (totalBookedSeatsOfClass / totalSeatsOfClass) * 100;

      let pricing;
      if (percentageBooked < 40) {
        pricing = seatPricing.minPrice;
      } else if (percentageBooked >= 40 && percentageBooked < 60) {
        pricing = seatPricing.normalPrice;
      } else {
        pricing = seatPricing.maxPrice;
      }

      totalAmount += pricing;
    }

    // Update the isBooked status of the seats
    await Seat.update({ isBooked: true }, { where: { id: seatIds } });

    res.json({ message: 'Booking created successfully', totalAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/bookings', async (req, res) => {
  const userIdentifier = req.query.userIdentifier;

  if (!userIdentifier) {
    res.status(400).json({ error: 'User identifier is required' });
    return;
  }

  try {
    const bookings = await Seat.findAll({
      where: Sequelize.or(
        { name: userIdentifier },
        { phoneNumber: userIdentifier }
      ),
      include: SeatPricing,
    });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Sync the models with the database and start the server
sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
});
