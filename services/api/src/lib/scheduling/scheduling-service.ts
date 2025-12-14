/**
 * Scheduling Service (F4.1)
 * Handles conflict detection and availability checking for bookings
 */

import prisma from "../prisma";
import logger from "../logger";
import { getTravelTime, calculateTravelBuffer, Coordinates } from "./travel-time-service";

// Types
export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface WeeklySchedule {
  mon: TimeSlot[];
  tue: TimeSlot[];
  wed: TimeSlot[];
  thu: TimeSlot[];
  fri: TimeSlot[];
  sat: TimeSlot[];
  sun: TimeSlot[];
}

export interface DateException {
  date: string; // YYYY-MM-DD
  blocked: boolean;
  note?: string;
}

export interface AvailabilityCheckInput {
  stylistId: string;
  serviceId: string;
  startTime: Date;
  durationMinutes: number;
  locationType: "STYLIST_LOCATION" | "CUSTOMER_LOCATION";
  customerCoords?: Coordinates;
}

export interface ConflictInfo {
  type: "SCHEDULE" | "EXCEPTION" | "BOOKING" | "TRAVEL_BUFFER";
  message: string;
  conflictingBookingId?: string;
}

export interface AvailabilityCheckResult {
  available: boolean;
  conflicts: ConflictInfo[];
  suggestedAlternatives: Date[];
  travelBufferMinutes?: number;
}

// Day mapping
const dayNames: (keyof WeeklySchedule)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Parse time string to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if a time falls within any time slot
 */
function isTimeInSlots(timeMinutes: number, slots: TimeSlot[]): boolean {
  return slots.some((slot) => {
    const start = parseTimeToMinutes(slot.start);
    const end = parseTimeToMinutes(slot.end);
    return timeMinutes >= start && timeMinutes < end;
  });
}

/**
 * Check if an appointment fits within any time slot
 */
function doesAppointmentFitInSlots(
  startMinutes: number,
  durationMinutes: number,
  slots: TimeSlot[]
): boolean {
  const endMinutes = startMinutes + durationMinutes;

  return slots.some((slot) => {
    const slotStart = parseTimeToMinutes(slot.start);
    const slotEnd = parseTimeToMinutes(slot.end);
    return startMinutes >= slotStart && endMinutes <= slotEnd;
  });
}

/**
 * Get available start times for a day within schedule slots
 */
function getAvailableStartTimes(
  slots: TimeSlot[],
  durationMinutes: number,
  intervalMinutes: number = 30
): number[] {
  const times: number[] = [];

  for (const slot of slots) {
    const slotStart = parseTimeToMinutes(slot.start);
    const slotEnd = parseTimeToMinutes(slot.end);

    for (let time = slotStart; time + durationMinutes <= slotEnd; time += intervalMinutes) {
      times.push(time);
    }
  }

  return times;
}

/**
 * Check availability for a specific booking request
 */
export async function checkAvailability(
  input: AvailabilityCheckInput
): Promise<AvailabilityCheckResult> {
  const conflicts: ConflictInfo[] = [];
  let travelBufferMinutes = 0;

  // Get stylist profile with availability
  const stylist = await prisma.stylistProfile.findFirst({
    where: {
      OR: [{ id: input.stylistId }, { userId: input.stylistId }],
    },
    include: {
      availability: true,
    },
  });

  if (!stylist) {
    return {
      available: false,
      conflicts: [{ type: "SCHEDULE", message: "Stylist not found" }],
      suggestedAlternatives: [],
    };
  }

  if (!stylist.isAcceptingBookings) {
    return {
      available: false,
      conflicts: [{ type: "SCHEDULE", message: "Stylist is not accepting bookings" }],
      suggestedAlternatives: [],
    };
  }

  const schedule = (stylist.availability?.schedule as WeeklySchedule) || null;
  const exceptions = (stylist.availability?.exceptions as DateException[]) || [];

  // Get day of week and time
  const requestedDate = new Date(input.startTime);
  const dayOfWeek = dayNames[requestedDate.getDay()];
  const dateStr = requestedDate.toISOString().split("T")[0];
  const requestedTimeMinutes =
    requestedDate.getHours() * 60 + requestedDate.getMinutes();

  // 1. Check for blocked exception dates
  const blockedException = exceptions.find(
    (e) => e.date === dateStr && e.blocked
  );
  if (blockedException) {
    conflicts.push({
      type: "EXCEPTION",
      message: blockedException.note || "Date is blocked by stylist",
    });
  }

  // 2. Check weekly schedule
  if (schedule) {
    const daySlots = schedule[dayOfWeek] || [];

    if (daySlots.length === 0) {
      conflicts.push({
        type: "SCHEDULE",
        message: `Stylist is not available on ${dayOfWeek}`,
      });
    } else if (
      !doesAppointmentFitInSlots(requestedTimeMinutes, input.durationMinutes, daySlots)
    ) {
      conflicts.push({
        type: "SCHEDULE",
        message: "Requested time does not fit within stylist's schedule",
      });
    }
  }

  // 3. Calculate travel buffer for mobile stylists
  if (
    input.locationType === "CUSTOMER_LOCATION" &&
    input.customerCoords &&
    (stylist.operatingMode === "MOBILE" || stylist.operatingMode === "HYBRID") &&
    stylist.baseLocationLat &&
    stylist.baseLocationLng
  ) {
    const stylistCoords: Coordinates = {
      lat: stylist.baseLocationLat,
      lng: stylist.baseLocationLng,
    };

    travelBufferMinutes = await calculateTravelBuffer(
      stylistCoords,
      input.customerCoords
    );

    logger.debug(`Calculated travel buffer: ${travelBufferMinutes} minutes`);
  }

  // 4. Check for conflicting bookings
  const bookingStartTime = new Date(input.startTime);
  const bookingEndTime = new Date(
    bookingStartTime.getTime() + input.durationMinutes * 60 * 1000
  );

  // Include travel buffer in conflict window
  const bufferStartTime = new Date(
    bookingStartTime.getTime() - travelBufferMinutes * 60 * 1000
  );
  const bufferEndTime = new Date(
    bookingEndTime.getTime() + travelBufferMinutes * 60 * 1000
  );

  // Find bookings that conflict
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      stylistId: stylist.userId,
      status: {
        in: [
          "PENDING_STYLIST_APPROVAL",
          "PENDING_CUSTOMER_PAYMENT",
          "CONFIRMED",
          "IN_PROGRESS",
        ],
      },
      OR: [
        // Existing booking overlaps with new booking
        {
          AND: [
            { scheduledStartTime: { lt: bufferEndTime } },
            { scheduledEndTime: { gt: bufferStartTime } },
          ],
        },
      ],
    },
    select: {
      id: true,
      scheduledStartTime: true,
      scheduledEndTime: true,
      serviceType: true,
    },
  });

  for (const booking of conflictingBookings) {
    conflicts.push({
      type: "BOOKING",
      message: `Conflicts with existing booking at ${booking.scheduledStartTime.toISOString()}`,
      conflictingBookingId: booking.id,
    });
  }

  // 5. Generate suggested alternatives if not available
  const suggestedAlternatives: Date[] = [];

  if (conflicts.length > 0) {
    // Look for alternatives in the next 7 days
    const alternatives = await findAlternativeSlots(
      stylist.userId,
      input.durationMinutes,
      requestedDate,
      schedule,
      exceptions,
      travelBufferMinutes,
      5 // Max 5 suggestions
    );
    suggestedAlternatives.push(...alternatives);
  }

  return {
    available: conflicts.length === 0,
    conflicts,
    suggestedAlternatives,
    travelBufferMinutes: travelBufferMinutes > 0 ? travelBufferMinutes : undefined,
  };
}

/**
 * Find alternative available time slots
 */
async function findAlternativeSlots(
  stylistUserId: string,
  durationMinutes: number,
  fromDate: Date,
  schedule: WeeklySchedule | null,
  exceptions: DateException[],
  travelBufferMinutes: number,
  maxSuggestions: number
): Promise<Date[]> {
  const alternatives: Date[] = [];
  const now = new Date();

  // Check each day for the next 7 days
  for (let dayOffset = 0; dayOffset < 7 && alternatives.length < maxSuggestions; dayOffset++) {
    const checkDate = new Date(fromDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    checkDate.setHours(0, 0, 0, 0);

    // Skip past dates
    if (checkDate < now) continue;

    const dateStr = checkDate.toISOString().split("T")[0];
    const dayOfWeek = dayNames[checkDate.getDay()];

    // Skip blocked dates
    const isBlocked = exceptions.some((e) => e.date === dateStr && e.blocked);
    if (isBlocked) continue;

    // Get day slots
    const daySlots = schedule?.[dayOfWeek] || [];
    if (daySlots.length === 0) continue;

    // Get available start times
    const availableStartTimes = getAvailableStartTimes(daySlots, durationMinutes);

    // Get existing bookings for this day
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingBookings = await prisma.booking.findMany({
      where: {
        stylistId: stylistUserId,
        status: {
          in: [
            "PENDING_STYLIST_APPROVAL",
            "PENDING_CUSTOMER_PAYMENT",
            "CONFIRMED",
            "IN_PROGRESS",
          ],
        },
        scheduledStartTime: { gte: dayStart, lt: dayEnd },
      },
      select: {
        scheduledStartTime: true,
        scheduledEndTime: true,
      },
    });

    // Find available slots
    for (const startMinutes of availableStartTimes) {
      if (alternatives.length >= maxSuggestions) break;

      const slotStart = new Date(checkDate);
      slotStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

      // Skip times in the past
      if (slotStart < now) continue;

      const slotEnd = new Date(
        slotStart.getTime() + durationMinutes * 60 * 1000
      );

      // Check for conflicts with existing bookings (including travel buffer)
      const bufferStart = new Date(
        slotStart.getTime() - travelBufferMinutes * 60 * 1000
      );
      const bufferEnd = new Date(
        slotEnd.getTime() + travelBufferMinutes * 60 * 1000
      );

      const hasConflict = existingBookings.some((booking) => {
        return (
          booking.scheduledStartTime < bufferEnd &&
          booking.scheduledEndTime > bufferStart
        );
      });

      if (!hasConflict) {
        alternatives.push(slotStart);
      }
    }
  }

  return alternatives;
}

/**
 * Check if a stylist is available for a quick check (without full details)
 */
export async function isTimeSlotAvailable(
  stylistId: string,
  startTime: Date,
  durationMinutes: number
): Promise<boolean> {
  const result = await checkAvailability({
    stylistId,
    serviceId: "", // Not needed for quick check
    startTime,
    durationMinutes,
    locationType: "STYLIST_LOCATION",
  });

  return result.available;
}

/**
 * Get available time slots for a specific date
 */
export async function getAvailableSlotsForDate(
  stylistId: string,
  date: Date,
  durationMinutes: number
): Promise<Date[]> {
  // Get stylist with availability
  const stylist = await prisma.stylistProfile.findFirst({
    where: {
      OR: [{ id: stylistId }, { userId: stylistId }],
    },
    include: {
      availability: true,
    },
  });

  if (!stylist || !stylist.isAcceptingBookings) {
    return [];
  }

  const schedule = (stylist.availability?.schedule as WeeklySchedule) || null;
  const exceptions = (stylist.availability?.exceptions as DateException[]) || [];

  const dateStr = date.toISOString().split("T")[0];
  const dayOfWeek = dayNames[date.getDay()];

  // Check for blocked exception
  const isBlocked = exceptions.some((e) => e.date === dateStr && e.blocked);
  if (isBlocked) {
    return [];
  }

  // Get day slots
  const daySlots = schedule?.[dayOfWeek] || [];
  if (daySlots.length === 0) {
    return [];
  }

  // Get available start times
  const availableStartTimes = getAvailableStartTimes(daySlots, durationMinutes);

  // Get existing bookings for this day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existingBookings = await prisma.booking.findMany({
    where: {
      stylistId: stylist.userId,
      status: {
        in: [
          "PENDING_STYLIST_APPROVAL",
          "PENDING_CUSTOMER_PAYMENT",
          "CONFIRMED",
          "IN_PROGRESS",
        ],
      },
      scheduledStartTime: { gte: dayStart, lt: dayEnd },
    },
    select: {
      scheduledStartTime: true,
      scheduledEndTime: true,
    },
  });

  // Default buffer for mobile stylists
  const travelBufferMinutes =
    stylist.operatingMode === "MOBILE" || stylist.operatingMode === "HYBRID"
      ? parseInt(process.env.DEFAULT_TRAVEL_BUFFER_MIN || "30", 10)
      : 0;

  const now = new Date();
  const availableSlots: Date[] = [];

  for (const startMinutes of availableStartTimes) {
    const slotStart = new Date(date);
    slotStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    // Skip times in the past
    if (slotStart < now) continue;

    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

    // Check for conflicts
    const bufferStart = new Date(
      slotStart.getTime() - travelBufferMinutes * 60 * 1000
    );
    const bufferEnd = new Date(
      slotEnd.getTime() + travelBufferMinutes * 60 * 1000
    );

    const hasConflict = existingBookings.some((booking) => {
      return (
        booking.scheduledStartTime < bufferEnd &&
        booking.scheduledEndTime > bufferStart
      );
    });

    if (!hasConflict) {
      availableSlots.push(slotStart);
    }
  }

  return availableSlots;
}
