const Logbook = require("../models/logbook.model");

/**
 * Currency Calculation Service
 * Calculates pilot currency status based on FAA regulations
 */

class CurrencyService {
  /**
   * Calculate 90-day passenger currency
   * Requires 3 takeoffs and landings in preceding 90 days
   */
  async calculatePassengerCurrency(userId) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentFlights = await Logbook.find({
      userId,
      date: { $gte: ninetyDaysAgo },
      dayLandings: { $gt: 0 }
    })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    const totalDayLandings = recentFlights.reduce(
      (sum, flight) => sum + (flight.dayLandings || 0),
      0
    );

    const isCurrent = totalDayLandings >= 3;

    // Find the 3rd most recent landing to calculate expiry
    let expiryDate = null;
    let landingCount = 0;
    
    for (const flight of recentFlights) {
      landingCount += flight.dayLandings || 0;
      if (landingCount >= 3) {
        expiryDate = new Date(flight.date);
        expiryDate.setDate(expiryDate.getDate() + 90);
        break;
      }
    }

    const daysRemaining = expiryDate
      ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      status: isCurrent ? "CURRENT" : "EXPIRED",
      required: 3,
      completed: totalDayLandings,
      lastLandings: recentFlights
        .slice(0, 3)
        .map((f) => ({
          date: f.date,
          landings: f.dayLandings
        })),
      expiryDate,
      daysRemaining,
      message: isCurrent
        ? `Current - ${totalDayLandings} day landings in last 90 days`
        : `Expired - Only ${totalDayLandings} day landings in last 90 days (need 3)`
    };
  }

  /**
   * Calculate 90-day night passenger currency
   * Requires 3 takeoffs and landings at night in preceding 90 days
   */
  async calculateNightCurrency(userId) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentFlights = await Logbook.find({
      userId,
      date: { $gte: ninetyDaysAgo },
      nightLandings: { $gt: 0 }
    })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    const totalNightLandings = recentFlights.reduce(
      (sum, flight) => sum + (flight.nightLandings || 0),
      0
    );

    const isCurrent = totalNightLandings >= 3;

    // Find the 3rd most recent night landing to calculate expiry
    let expiryDate = null;
    let landingCount = 0;
    
    for (const flight of recentFlights) {
      landingCount += flight.nightLandings || 0;
      if (landingCount >= 3) {
        expiryDate = new Date(flight.date);
        expiryDate.setDate(expiryDate.getDate() + 90);
        break;
      }
    }

    const daysRemaining = expiryDate
      ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      status: isCurrent ? "CURRENT" : "EXPIRED",
      required: 3,
      completed: totalNightLandings,
      lastLandings: recentFlights
        .slice(0, 3)
        .map((f) => ({
          date: f.date,
          landings: f.nightLandings
        })),
      expiryDate,
      daysRemaining,
      message: isCurrent
        ? `Current - ${totalNightLandings} night landings in last 90 days`
        : `Expired - Only ${totalNightLandings} night landings in last 90 days (need 3)`
    };
  }

  /**
   * Calculate instrument currency
   * Requires 6 approaches in preceding 6 months
   * (Simplified - full implementation would track approaches)
   */
  async calculateInstrumentCurrency(userId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentFlights = await Logbook.find({
      userId,
      date: { $gte: sixMonthsAgo },
      $or: [
        { instrumentActual: { $gt: 0 } },
        { instrumentSimulated: { $gt: 0 } }
      ]
    })
      .sort({ date: -1 })
      .lean();

    const totalInstrumentTime = recentFlights.reduce(
      (sum, flight) =>
        sum + (flight.instrumentActual || 0) + (flight.instrumentSimulated || 0),
      0
    );

    // Simplified: assume current if any instrument time in last 6 months
    const isCurrent = totalInstrumentTime > 0;

    return {
      status: isCurrent ? "CURRENT" : "EXPIRED",
      instrumentTime: totalInstrumentTime,
      recentFlights: recentFlights.length,
      message: isCurrent
        ? `Current - ${totalInstrumentTime.toFixed(1)} instrument hours in last 6 months`
        : "Expired - No instrument time logged in last 6 months"
    };
  }

  /**
   * Calculate flight review (BFR) status
   * Requires flight review every 24 months
   * (Simplified - would need dedicated flight review tracking)
   */
  async calculateFlightReview(userId) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Check for dual received flights (training) as proxy for flight reviews
    const recentTraining = await Logbook.findOne({
      userId,
      date: { $gte: twoYearsAgo },
      dualReceived: { $gt: 0 }
    })
      .sort({ date: -1 })
      .lean();

    const isCurrent = !!recentTraining;

    let expiryDate = null;
    let daysRemaining = null;

    if (recentTraining) {
      expiryDate = new Date(recentTraining.date);
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    }

    return {
      status: isCurrent ? "CURRENT" : "EXPIRED",
      lastReviewDate: recentTraining?.date || null,
      expiryDate,
      daysRemaining,
      message: isCurrent
        ? `Current - Last training flight on ${recentTraining.date.toLocaleDateString()}`
        : "Expired - No dual instruction logged in last 24 months"
    };
  }

  /**
   * Get complete currency status for a pilot
   */
  async getCurrencyStatus(userId) {
    const [passenger, night, instrument, flightReview] = await Promise.all([
      this.calculatePassengerCurrency(userId),
      this.calculateNightCurrency(userId),
      this.calculateInstrumentCurrency(userId),
      this.calculateFlightReview(userId)
    ]);

    // Determine overall flight readiness
    const isFlightReady =
      passenger.status === "CURRENT" && flightReview.status === "CURRENT";

    // Find next expiring currency
    const expiringItems = [
      { name: "Passenger Currency", days: passenger.daysRemaining },
      { name: "Night Currency", days: night.daysRemaining },
      { name: "Flight Review", days: flightReview.daysRemaining }
    ]
      .filter((item) => item.days !== null && item.days > 0)
      .sort((a, b) => a.days - b.days);

    const nextExpiring = expiringItems[0] || null;

    return {
      isFlightReady,
      passengerCurrency: passenger,
      nightCurrency: night,
      instrumentCurrency: instrument,
      flightReview: flightReview,
      nextExpiring,
      summary: {
        status: isFlightReady ? "FLIGHT READY" : "NOT FLIGHT READY",
        message: isFlightReady
          ? "All required currencies are current"
          : "One or more currencies expired",
        expiringWithin30Days: expiringItems.filter((item) => item.days <= 30)
      }
    };
  }

  /**
   * Calculate total flight hours breakdown
   */
  async getFlightHoursBreakdown(userId) {
    const allFlights = await Logbook.find({ userId }).lean();

    const breakdown = {
      totalTime: 0,
      pilotInCommand: 0,
      secondInCommand: 0,
      dualReceived: 0,
      dualGiven: 0,
      soloTime: 0,
      crossCountry: 0,
      nightTime: 0,
      instrumentActual: 0,
      instrumentSimulated: 0,
      totalInstrument: 0,
      totalFlights: allFlights.length,
      dayLandings: 0,
      nightLandings: 0
    };

    allFlights.forEach((flight) => {
      breakdown.totalTime += flight.totalTime || flight.hours || 0;
      breakdown.pilotInCommand += flight.pilotInCommand || 0;
      breakdown.secondInCommand += flight.secondInCommand || 0;
      breakdown.dualReceived += flight.dualReceived || 0;
      breakdown.dualGiven += flight.dualGiven || 0;
      breakdown.soloTime += flight.soloTime || 0;
      breakdown.crossCountry += flight.crossCountry || 0;
      breakdown.nightTime += flight.nightTime || 0;
      breakdown.instrumentActual += flight.instrumentActual || 0;
      breakdown.instrumentSimulated += flight.instrumentSimulated || 0;
      breakdown.dayLandings += flight.dayLandings || 0;
      breakdown.nightLandings += flight.nightLandings || 0;
    });

    breakdown.totalInstrument =
      breakdown.instrumentActual + breakdown.instrumentSimulated;

    return breakdown;
  }
}

module.exports = new CurrencyService();
