const Venue = require('../models/Venue');
const Coach = require('../models/Coach');
const Equipment = require('../models/Equipment');
const Tariff = require('../models/Tariff');

const calculateDuration = (start, end) => {
  const startTime = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  return (endTime - startTime) / (1000 * 60 * 60); // hours
};

const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
};

const calculateBaseVenueCost = async (venueId, slot) => {
  const venue = await Venue.findById(venueId);
  const tariff = await Tariff.findOne({
    venue: venueId,
    day: getDayOfWeek(slot.date),
    timeStart: { $lte: slot.start },
    timeEnd: { $gte: slot.end }
  });
  
  return tariff ? tariff.price : venue.pricePerHour;
};

const calculateCoachFee = async (coachId, duration) => {
  const coach = await Coach.findById(coachId);
  return coach.hourlyRate * duration;
};

const calculateEquipmentCosts = async (equipmentList) => {
  const equipment = await Equipment.find({ _id: { $in: equipmentList } });
  return equipment.reduce((total, item) => total + item.rentalPrice, 0);
};

const calculateDiscount = async (bookingDetails) => {
  // Implement discount logic here
  // Could be based on:
  // - User membership level
  // - Special promotions
  // - Bulk bookings
  return 0;
};

exports.calculateTotalPayment = async (bookingDetails) => {
  const {
    venueId,
    coachId,
    slot,
    equipmentList = [],
  } = bookingDetails;

  const duration = calculateDuration(slot.start, slot.end);
  
  // Calculate base venue cost
  const venueCost = await calculateBaseVenueCost(venueId, slot);
  
  // Calculate coach fee if applicable
  const coachFee = coachId ? await calculateCoachFee(coachId, duration) : 0;
  
  // Calculate equipment costs
  const equipmentCosts = equipmentList.length > 0 
    ? await calculateEquipmentCosts(equipmentList) 
    : 0;

  // Calculate total
  const subtotal = (venueCost * duration) + coachFee + equipmentCosts;
  
  // Apply any discounts or promotions
  const discount = await calculateDiscount(bookingDetails);
  
  // Calculate final total
  const total = subtotal - discount;

  return {
    venueCost: venueCost * duration,
    coachFee,
    equipmentCosts,
    discount,
    subtotal,
    total
  };
}; 