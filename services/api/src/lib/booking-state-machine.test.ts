import { BookingStatus } from '@prisma/client';
import {
  VALID_TRANSITIONS,
  canTransitionTo,
  validateTransition,
  isTerminalStatus,
  getValidNextStates,
} from './booking-state-machine';

describe('Booking State Machine Module', () => {
  describe('canTransitionTo', () => {
    describe('Valid transitions from PENDING_STYLIST_APPROVAL', () => {
      it('should allow PENDING_STYLIST_APPROVAL → PENDING_CUSTOMER_PAYMENT', () => {
        expect(
          canTransitionTo(
            BookingStatus.PENDING_STYLIST_APPROVAL,
            BookingStatus.PENDING_CUSTOMER_PAYMENT
          )
        ).toBe(true);
      });

      it('should allow PENDING_STYLIST_APPROVAL → DECLINED', () => {
        expect(
          canTransitionTo(
            BookingStatus.PENDING_STYLIST_APPROVAL,
            BookingStatus.DECLINED
          )
        ).toBe(true);
      });

      it('should allow PENDING_STYLIST_APPROVAL → CANCELLED', () => {
        expect(
          canTransitionTo(
            BookingStatus.PENDING_STYLIST_APPROVAL,
            BookingStatus.CANCELLED
          )
        ).toBe(true);
      });
    });

    describe('Valid transitions from PENDING_CUSTOMER_PAYMENT', () => {
      it('should allow PENDING_CUSTOMER_PAYMENT → CONFIRMED', () => {
        expect(
          canTransitionTo(
            BookingStatus.PENDING_CUSTOMER_PAYMENT,
            BookingStatus.CONFIRMED
          )
        ).toBe(true);
      });

      it('should allow PENDING_CUSTOMER_PAYMENT → CANCELLED', () => {
        expect(
          canTransitionTo(
            BookingStatus.PENDING_CUSTOMER_PAYMENT,
            BookingStatus.CANCELLED
          )
        ).toBe(true);
      });
    });

    describe('Valid transitions from CONFIRMED', () => {
      it('should allow CONFIRMED → IN_PROGRESS', () => {
        expect(
          canTransitionTo(BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS)
        ).toBe(true);
      });

      it('should allow CONFIRMED → CANCELLED', () => {
        expect(
          canTransitionTo(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)
        ).toBe(true);
      });
    });

    describe('Valid transitions from IN_PROGRESS', () => {
      it('should allow IN_PROGRESS → COMPLETED', () => {
        expect(
          canTransitionTo(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED)
        ).toBe(true);
      });

      it('should allow IN_PROGRESS → CANCELLED', () => {
        expect(
          canTransitionTo(BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED)
        ).toBe(true);
      });
    });

    describe('Valid transitions from COMPLETED', () => {
      it('should allow COMPLETED → AWAITING_CUSTOMER_CONFIRMATION', () => {
        expect(
          canTransitionTo(
            BookingStatus.COMPLETED,
            BookingStatus.AWAITING_CUSTOMER_CONFIRMATION
          )
        ).toBe(true);
      });

      it('should allow COMPLETED → DISPUTED', () => {
        expect(
          canTransitionTo(BookingStatus.COMPLETED, BookingStatus.DISPUTED)
        ).toBe(true);
      });
    });

    describe('Valid transitions from AWAITING_CUSTOMER_CONFIRMATION', () => {
      it('should allow AWAITING_CUSTOMER_CONFIRMATION → SETTLED', () => {
        expect(
          canTransitionTo(
            BookingStatus.AWAITING_CUSTOMER_CONFIRMATION,
            BookingStatus.SETTLED
          )
        ).toBe(true);
      });

      it('should allow AWAITING_CUSTOMER_CONFIRMATION → DISPUTED', () => {
        expect(
          canTransitionTo(
            BookingStatus.AWAITING_CUSTOMER_CONFIRMATION,
            BookingStatus.DISPUTED
          )
        ).toBe(true);
      });
    });

    describe('Valid transitions from DISPUTED', () => {
      it('should allow DISPUTED → SETTLED', () => {
        expect(
          canTransitionTo(BookingStatus.DISPUTED, BookingStatus.SETTLED)
        ).toBe(true);
      });

      it('should allow DISPUTED → CANCELLED', () => {
        expect(
          canTransitionTo(BookingStatus.DISPUTED, BookingStatus.CANCELLED)
        ).toBe(true);
      });
    });

    describe('Invalid transitions from terminal states', () => {
      it('should not allow SETTLED → any status', () => {
        expect(
          canTransitionTo(BookingStatus.SETTLED, BookingStatus.CONFIRMED)
        ).toBe(false);
        expect(
          canTransitionTo(BookingStatus.SETTLED, BookingStatus.CANCELLED)
        ).toBe(false);
        expect(
          canTransitionTo(BookingStatus.SETTLED, BookingStatus.DISPUTED)
        ).toBe(false);
      });

      it('should not allow CANCELLED → any status', () => {
        expect(
          canTransitionTo(BookingStatus.CANCELLED, BookingStatus.CONFIRMED)
        ).toBe(false);
        expect(
          canTransitionTo(BookingStatus.CANCELLED, BookingStatus.SETTLED)
        ).toBe(false);
        expect(
          canTransitionTo(
            BookingStatus.CANCELLED,
            BookingStatus.PENDING_CUSTOMER_PAYMENT
          )
        ).toBe(false);
      });

      it('should not allow DECLINED → any status', () => {
        expect(
          canTransitionTo(BookingStatus.DECLINED, BookingStatus.CONFIRMED)
        ).toBe(false);
        expect(
          canTransitionTo(
            BookingStatus.DECLINED,
            BookingStatus.PENDING_STYLIST_APPROVAL
          )
        ).toBe(false);
        expect(
          canTransitionTo(BookingStatus.DECLINED, BookingStatus.SETTLED)
        ).toBe(false);
      });
    });

    describe('Invalid transitions - backward flows', () => {
      it('should not allow CONFIRMED → PENDING_CUSTOMER_PAYMENT', () => {
        expect(
          canTransitionTo(
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING_CUSTOMER_PAYMENT
          )
        ).toBe(false);
      });

      it('should not allow IN_PROGRESS → CONFIRMED', () => {
        expect(
          canTransitionTo(BookingStatus.IN_PROGRESS, BookingStatus.CONFIRMED)
        ).toBe(false);
      });

      it('should not allow COMPLETED → IN_PROGRESS', () => {
        expect(
          canTransitionTo(BookingStatus.COMPLETED, BookingStatus.IN_PROGRESS)
        ).toBe(false);
      });

      it('should not allow SETTLED → COMPLETED', () => {
        expect(
          canTransitionTo(BookingStatus.SETTLED, BookingStatus.COMPLETED)
        ).toBe(false);
      });
    });

    describe('Invalid transitions - cross-branch flows', () => {
      it('should not allow PENDING_STYLIST_APPROVAL → CONFIRMED', () => {
        expect(
          canTransitionTo(
            BookingStatus.PENDING_STYLIST_APPROVAL,
            BookingStatus.CONFIRMED
          )
        ).toBe(false);
      });

      it('should not allow PENDING_CUSTOMER_PAYMENT → IN_PROGRESS', () => {
        expect(
          canTransitionTo(
            BookingStatus.PENDING_CUSTOMER_PAYMENT,
            BookingStatus.IN_PROGRESS
          )
        ).toBe(false);
      });

      it('should not allow CONFIRMED → COMPLETED', () => {
        expect(
          canTransitionTo(BookingStatus.CONFIRMED, BookingStatus.COMPLETED)
        ).toBe(false);
      });

      it('should not allow IN_PROGRESS → SETTLED', () => {
        expect(
          canTransitionTo(BookingStatus.IN_PROGRESS, BookingStatus.SETTLED)
        ).toBe(false);
      });
    });
  });

  describe('validateTransition', () => {
    describe('Valid transitions', () => {
      it('should not throw for valid transition: PENDING_STYLIST_APPROVAL → PENDING_CUSTOMER_PAYMENT', () => {
        expect(() => {
          validateTransition(
            BookingStatus.PENDING_STYLIST_APPROVAL,
            BookingStatus.PENDING_CUSTOMER_PAYMENT
          );
        }).not.toThrow();
      });

      it('should not throw for valid transition: CONFIRMED → IN_PROGRESS', () => {
        expect(() => {
          validateTransition(
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS
          );
        }).not.toThrow();
      });

      it('should not throw for valid transition: COMPLETED → AWAITING_CUSTOMER_CONFIRMATION', () => {
        expect(() => {
          validateTransition(
            BookingStatus.COMPLETED,
            BookingStatus.AWAITING_CUSTOMER_CONFIRMATION
          );
        }).not.toThrow();
      });

      it('should not throw for valid transition: DISPUTED → SETTLED', () => {
        expect(() => {
          validateTransition(BookingStatus.DISPUTED, BookingStatus.SETTLED);
        }).not.toThrow();
      });
    });

    describe('Invalid transitions', () => {
      it('should throw error for invalid transition: SETTLED → CONFIRMED', () => {
        expect(() => {
          validateTransition(BookingStatus.SETTLED, BookingStatus.CONFIRMED);
        }).toThrow('Invalid status transition: SETTLED -> CONFIRMED');
      });

      it('should throw error for invalid transition: CANCELLED → IN_PROGRESS', () => {
        expect(() => {
          validateTransition(
            BookingStatus.CANCELLED,
            BookingStatus.IN_PROGRESS
          );
        }).toThrow('Invalid status transition: CANCELLED -> IN_PROGRESS');
      });

      it('should throw error for invalid transition: CONFIRMED → PENDING_CUSTOMER_PAYMENT', () => {
        expect(() => {
          validateTransition(
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING_CUSTOMER_PAYMENT
          );
        }).toThrow(
          'Invalid status transition: CONFIRMED -> PENDING_CUSTOMER_PAYMENT'
        );
      });

      it('should throw error for invalid transition: IN_PROGRESS → SETTLED', () => {
        expect(() => {
          validateTransition(BookingStatus.IN_PROGRESS, BookingStatus.SETTLED);
        }).toThrow('Invalid status transition: IN_PROGRESS -> SETTLED');
      });

      it('should throw error with correct format', () => {
        expect(() => {
          validateTransition(
            BookingStatus.DECLINED,
            BookingStatus.PENDING_STYLIST_APPROVAL
          );
        }).toThrow(/^Invalid status transition:/);
      });
    });
  });

  describe('isTerminalStatus', () => {
    describe('Terminal statuses', () => {
      it('should return true for SETTLED', () => {
        expect(isTerminalStatus(BookingStatus.SETTLED)).toBe(true);
      });

      it('should return true for CANCELLED', () => {
        expect(isTerminalStatus(BookingStatus.CANCELLED)).toBe(true);
      });

      it('should return true for DECLINED', () => {
        expect(isTerminalStatus(BookingStatus.DECLINED)).toBe(true);
      });

      it('should verify terminal statuses have no outgoing transitions', () => {
        expect(VALID_TRANSITIONS[BookingStatus.SETTLED]).toEqual([]);
        expect(VALID_TRANSITIONS[BookingStatus.CANCELLED]).toEqual([]);
        expect(VALID_TRANSITIONS[BookingStatus.DECLINED]).toEqual([]);
      });
    });

    describe('Non-terminal statuses', () => {
      it('should return false for PENDING_STYLIST_APPROVAL', () => {
        expect(isTerminalStatus(BookingStatus.PENDING_STYLIST_APPROVAL)).toBe(
          false
        );
      });

      it('should return false for PENDING_CUSTOMER_PAYMENT', () => {
        expect(isTerminalStatus(BookingStatus.PENDING_CUSTOMER_PAYMENT)).toBe(
          false
        );
      });

      it('should return false for CONFIRMED', () => {
        expect(isTerminalStatus(BookingStatus.CONFIRMED)).toBe(false);
      });

      it('should return false for IN_PROGRESS', () => {
        expect(isTerminalStatus(BookingStatus.IN_PROGRESS)).toBe(false);
      });

      it('should return false for COMPLETED', () => {
        expect(isTerminalStatus(BookingStatus.COMPLETED)).toBe(false);
      });

      it('should return false for AWAITING_CUSTOMER_CONFIRMATION', () => {
        expect(
          isTerminalStatus(BookingStatus.AWAITING_CUSTOMER_CONFIRMATION)
        ).toBe(false);
      });

      it('should return false for DISPUTED', () => {
        expect(isTerminalStatus(BookingStatus.DISPUTED)).toBe(false);
      });
    });
  });

  describe('getValidNextStates', () => {
    describe('Non-terminal statuses', () => {
      it('should return correct next states for PENDING_STYLIST_APPROVAL', () => {
        const validNext = getValidNextStates(
          BookingStatus.PENDING_STYLIST_APPROVAL
        );
        expect(validNext).toHaveLength(3);
        expect(validNext).toContain(BookingStatus.PENDING_CUSTOMER_PAYMENT);
        expect(validNext).toContain(BookingStatus.DECLINED);
        expect(validNext).toContain(BookingStatus.CANCELLED);
      });

      it('should return correct next states for PENDING_CUSTOMER_PAYMENT', () => {
        const validNext = getValidNextStates(
          BookingStatus.PENDING_CUSTOMER_PAYMENT
        );
        expect(validNext).toHaveLength(2);
        expect(validNext).toContain(BookingStatus.CONFIRMED);
        expect(validNext).toContain(BookingStatus.CANCELLED);
      });

      it('should return correct next states for CONFIRMED', () => {
        const validNext = getValidNextStates(BookingStatus.CONFIRMED);
        expect(validNext).toHaveLength(2);
        expect(validNext).toContain(BookingStatus.IN_PROGRESS);
        expect(validNext).toContain(BookingStatus.CANCELLED);
      });

      it('should return correct next states for IN_PROGRESS', () => {
        const validNext = getValidNextStates(BookingStatus.IN_PROGRESS);
        expect(validNext).toHaveLength(2);
        expect(validNext).toContain(BookingStatus.COMPLETED);
        expect(validNext).toContain(BookingStatus.CANCELLED);
      });

      it('should return correct next states for COMPLETED', () => {
        const validNext = getValidNextStates(BookingStatus.COMPLETED);
        expect(validNext).toHaveLength(2);
        expect(validNext).toContain(
          BookingStatus.AWAITING_CUSTOMER_CONFIRMATION
        );
        expect(validNext).toContain(BookingStatus.DISPUTED);
      });

      it('should return correct next states for AWAITING_CUSTOMER_CONFIRMATION', () => {
        const validNext = getValidNextStates(
          BookingStatus.AWAITING_CUSTOMER_CONFIRMATION
        );
        expect(validNext).toHaveLength(2);
        expect(validNext).toContain(BookingStatus.SETTLED);
        expect(validNext).toContain(BookingStatus.DISPUTED);
      });

      it('should return correct next states for DISPUTED', () => {
        const validNext = getValidNextStates(BookingStatus.DISPUTED);
        expect(validNext).toHaveLength(2);
        expect(validNext).toContain(BookingStatus.SETTLED);
        expect(validNext).toContain(BookingStatus.CANCELLED);
      });
    });

    describe('Terminal statuses', () => {
      it('should return empty array for SETTLED', () => {
        const validNext = getValidNextStates(BookingStatus.SETTLED);
        expect(validNext).toEqual([]);
        expect(validNext).toHaveLength(0);
      });

      it('should return empty array for CANCELLED', () => {
        const validNext = getValidNextStates(BookingStatus.CANCELLED);
        expect(validNext).toEqual([]);
        expect(validNext).toHaveLength(0);
      });

      it('should return empty array for DECLINED', () => {
        const validNext = getValidNextStates(BookingStatus.DECLINED);
        expect(validNext).toEqual([]);
        expect(validNext).toHaveLength(0);
      });
    });
  });

  describe('Integration: State machine integrity', () => {
    it('should have valid transitions defined for all BookingStatus values', () => {
      const allStatuses = Object.values(BookingStatus);
      allStatuses.forEach((status) => {
        expect(VALID_TRANSITIONS).toHaveProperty(status);
      });
    });

    it('should have all transitions be valid BookingStatus values', () => {
      const allStatuses = Object.values(BookingStatus);
      Object.entries(VALID_TRANSITIONS).forEach(([_status, transitions]) => {
        transitions.forEach((targetStatus) => {
          expect(allStatuses).toContain(targetStatus);
        });
      });
    });

    it('should have exactly 3 terminal statuses', () => {
      const terminalStatuses = Object.values(BookingStatus).filter(
        isTerminalStatus
      );
      expect(terminalStatuses).toHaveLength(3);
      expect(terminalStatuses).toContain(BookingStatus.SETTLED);
      expect(terminalStatuses).toContain(BookingStatus.CANCELLED);
      expect(terminalStatuses).toContain(BookingStatus.DECLINED);
    });

    it('should have consistent canTransitionTo and getValidNextStates', () => {
      const allStatuses = Object.values(BookingStatus);
      allStatuses.forEach((fromStatus) => {
        const validNext = getValidNextStates(fromStatus);
        allStatuses.forEach((toStatus) => {
          const canTransition = canTransitionTo(fromStatus, toStatus);
          const inValidNext = validNext.includes(toStatus);
          expect(canTransition).toBe(inValidNext);
        });
      });
    });

    it('should have consistent isTerminalStatus and getValidNextStates', () => {
      const allStatuses = Object.values(BookingStatus);
      allStatuses.forEach((status) => {
        const isTerminal = isTerminalStatus(status);
        const validNext = getValidNextStates(status);
        expect(isTerminal).toBe(validNext.length === 0);
      });
    });

    it('should validate all valid transitions without throwing', () => {
      Object.entries(VALID_TRANSITIONS).forEach(([fromStatus, toStatuses]) => {
        toStatuses.forEach((toStatus) => {
          expect(() => {
            validateTransition(fromStatus as BookingStatus, toStatus);
          }).not.toThrow();
        });
      });
    });
  });
});
