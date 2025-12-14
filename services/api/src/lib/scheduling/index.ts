/**
 * Scheduling Module Index
 * Exports all scheduling-related services
 */

export {
  getTravelTime,
  calculateTravelBuffer,
  calculateHaversineDistance,
  getDefaultTravelBuffer,
  clearTravelTimeCache,
  getCacheStats,
  type TravelTimeResult,
  type Coordinates,
} from "./travel-time-service";

export {
  checkAvailability,
  isTimeSlotAvailable,
  getAvailableSlotsForDate,
  type AvailabilityCheckInput,
  type AvailabilityCheckResult,
  type ConflictInfo,
  type TimeSlot,
  type WeeklySchedule,
  type DateException,
} from "./scheduling-service";
