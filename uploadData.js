const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const { Seat, SeatPricing } = require('./index');

// Remove the following line since Seat is already imported from './index'
// const Seat = require('./models/Seat');

async function uploadData() {
  try {
    const seatsCsv = fs.readFileSync('./data/Seats - MOCK_DATA .csv');
    const seatPricingCsv = fs.readFileSync('./data/SeatPricing - MOCK_DATA .csv');

    const seats = parse(seatsCsv, { columns: true });
    const seatPricing = parse(seatPricingCsv, { columns: true });

    await Seat.bulkCreate(seats);
    await SeatPricing.bulkCreate(seatPricing);

    console.log('Data uploaded successfully');
  } catch (error) {
    console.error('An error occurred while uploading data:', error);
  }
}

uploadData();
