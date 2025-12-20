/**
 * Booking Flow Screen (V6.10.0)
 *
 * Multi-step booking flow for scheduling a service with a stylist
 * Steps: Service Selection → Date/Time → Location → Confirmation
 *
 * Wired to real API with wallet balance check and error handling.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomCalendarIcon,
  VlossomLocationIcon,
  VlossomWalletIcon,
} from '../../../src/components/icons/VlossomIcons';
import { useState, useEffect, useCallback } from 'react';
import {
  useStylistsStore,
  selectSelectedStylist,
  useBookingsStore,
  selectCreateLoading,
  selectCreateError,
  selectAvailability,
  useWalletStore,
  selectBalance,
} from '../../../src/stores';
import { formatPrice, type StylistService } from '../../../src/api/stylists';
import {
  type LocationType,
  calculatePriceBreakdown,
  generateTimeSlots,
} from '../../../src/api/bookings';

type BookingStep = 'service' | 'datetime' | 'location' | 'confirm';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Stylists store
  const stylist = useStylistsStore(selectSelectedStylist);
  const { selectedStylistLoading, selectStylist } = useStylistsStore();

  // Bookings store
  const createLoading = useBookingsStore(selectCreateLoading);
  const createError = useBookingsStore(selectCreateError);
  const availability = useBookingsStore(selectAvailability);
  const { createBooking, fetchAvailability, clearErrors } = useBookingsStore();

  // Wallet store for balance check
  const balance = useWalletStore(selectBalance);
  const { fetchBalance } = useWalletStore();

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<StylistService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [locationChoice, setLocationChoice] = useState<'stylist' | 'customer' | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');

  // Fetch stylist and balance if not loaded
  useEffect(() => {
    if (id && !stylist) {
      selectStylist(id);
    }
    if (!balance) {
      fetchBalance();
    }
  }, [id, stylist, selectStylist, balance, fetchBalance]);

  // Clear errors on unmount
  useEffect(() => {
    return () => clearErrors();
  }, [clearErrors]);

  // Show error alert if booking fails
  useEffect(() => {
    if (createError) {
      Alert.alert('Booking Failed', createError, [
        { text: 'OK', onPress: clearErrors },
      ]);
    }
  }, [createError, clearErrors]);

  const handleBack = () => {
    if (currentStep === 'service') {
      router.back();
    } else if (currentStep === 'datetime') {
      setCurrentStep('service');
    } else if (currentStep === 'location') {
      setCurrentStep('datetime');
    } else if (currentStep === 'confirm') {
      setCurrentStep('location');
    }
  };

  const handleSelectService = (service: StylistService) => {
    setSelectedService(service);
    setCurrentStep('datetime');
  };

  const handleSelectDateTime = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep('location');
  };

  const handleSelectLocation = (choice: 'stylist' | 'customer') => {
    setLocationChoice(choice);
    // Set default address based on choice
    if (choice === 'stylist' && stylist?.baseLocation?.address) {
      setLocationAddress(stylist.baseLocation.address);
    } else {
      setLocationAddress(''); // User will need to provide
    }
    setCurrentStep('confirm');
  };

  const handleConfirmBooking = useCallback(async () => {
    if (!stylist || !selectedService || !selectedDate || !selectedTime || !locationChoice) {
      return;
    }

    // Check wallet balance
    const servicePriceCents = parseInt(selectedService.priceAmountCents, 10);
    const priceBreakdown = calculatePriceBreakdown(servicePriceCents, locationChoice === 'customer');
    const balanceUsdcCents = balance ? Math.floor(parseFloat(balance.usdc) * 100) : 0;

    if (balanceUsdcCents < priceBreakdown.totalAmount) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${formatPrice(priceBreakdown.totalAmount)} but only have ${formatPrice(balanceUsdcCents)}. Please fund your wallet first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Fund Wallet', onPress: () => router.push('/wallet/fund') },
        ]
      );
      return;
    }

    // Build scheduled time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledStartTime = new Date(selectedDate);
    scheduledStartTime.setHours(hours, minutes, 0, 0);

    // Determine location type and address
    const locationType: LocationType = locationChoice === 'stylist' ? 'STYLIST_BASE' : 'CUSTOMER_HOME';
    const address = locationChoice === 'stylist'
      ? stylist.baseLocation?.address || 'Stylist location'
      : locationAddress || 'Customer location';

    const booking = await createBooking({
      stylistId: stylist.id,
      serviceId: selectedService.id,
      scheduledStartTime: scheduledStartTime.toISOString(),
      locationType,
      locationAddress: address,
      locationLat: locationChoice === 'stylist' ? stylist.baseLocation?.lat : undefined,
      locationLng: locationChoice === 'stylist' ? stylist.baseLocation?.lng : undefined,
    });

    if (booking) {
      // Success! Navigate to booking details or confirmation
      Alert.alert(
        'Booking Confirmed!',
        `Your appointment with ${stylist.displayName} is confirmed for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
        [
          {
            text: 'View Booking',
            onPress: () => router.replace(`/bookings/${booking.id}`),
          },
        ]
      );
    }
  }, [
    stylist,
    selectedService,
    selectedDate,
    selectedTime,
    locationChoice,
    locationAddress,
    balance,
    createBooking,
    router,
  ]);

  const getStepNumber = () => {
    switch (currentStep) {
      case 'service':
        return 1;
      case 'datetime':
        return 2;
      case 'location':
        return 3;
      case 'confirm':
        return 4;
    }
  };

  // Loading state
  if (selectedStylistLoading || !stylist) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
            Book with {stylist.displayName}
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
            Step {getStepNumber()} of 4
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.surface.light }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${(getStepNumber() / 4) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.lg }}>
        {currentStep === 'service' && (
          <ServiceStep
            services={stylist.services}
            onSelect={handleSelectService}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
          />
        )}

        {currentStep === 'datetime' && (
          <DateTimeStep
            onSelect={handleSelectDateTime}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        )}

        {currentStep === 'location' && (
          <LocationStep
            operatingMode={stylist.operatingMode}
            onSelect={handleSelectLocation}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
          />
        )}

        {currentStep === 'confirm' && (
          <ConfirmStep
            stylistName={stylist.displayName}
            service={selectedService!}
            date={selectedDate!}
            time={selectedTime!}
            locationChoice={locationChoice!}
            balance={balance}
            isLoading={createLoading}
            onConfirm={handleConfirmBooking}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
          />
        )}
      </ScrollView>
    </View>
  );
}

// Service Selection Step
interface ServiceStepProps {
  services: StylistService[];
  onSelect: (service: StylistService) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function ServiceStep({ services, onSelect, colors, spacing, borderRadius, shadows }: ServiceStepProps) {
  return (
    <View>
      <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
        Select a Service
      </Text>
      {services.map((service) => (
        <Pressable
          key={service.id}
          onPress={() => onSelect(service)}
          style={[
            styles.serviceCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.md,
              ...shadows.card,
            },
          ]}
        >
          <View style={styles.serviceInfo}>
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
              {service.name}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              {service.category} · {service.estimatedDurationMin} min
            </Text>
            {service.description && (
              <Text
                style={[textStyles.bodySmall, { color: colors.text.secondary, marginTop: spacing.xs }]}
                numberOfLines={2}
              >
                {service.description}
              </Text>
            )}
          </View>
          <Text style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]}>
            {formatPrice(service.priceAmountCents)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Date/Time Selection Step (Simplified for now)
interface DateTimeStepProps {
  onSelect: (date: Date, time: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function DateTimeStep({ onSelect, colors, spacing, borderRadius }: DateTimeStepProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Generate next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  // Mock time slots
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  const handleContinue = () => {
    if (selectedDay !== null && selectedTimeSlot) {
      onSelect(days[selectedDay], selectedTimeSlot);
    }
  };

  return (
    <View>
      <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
        Select Date
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
        {days.map((date, index) => {
          const isSelected = selectedDay === index;
          const dayName = date.toLocaleDateString('en-ZA', { weekday: 'short' });
          const dayNumber = date.getDate();
          return (
            <Pressable
              key={index}
              onPress={() => setSelectedDay(index)}
              style={[
                styles.dayCard,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                  borderRadius: borderRadius.md,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.caption,
                  { color: isSelected ? colors.white : colors.text.tertiary },
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  textStyles.h3,
                  { color: isSelected ? colors.white : colors.text.primary },
                ]}
              >
                {dayNumber}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
        Select Time
      </Text>
      <View style={styles.timeGrid}>
        {timeSlots.map((time) => {
          const isSelected = selectedTimeSlot === time;
          return (
            <Pressable
              key={time}
              onPress={() => setSelectedTimeSlot(time)}
              style={[
                styles.timeSlot,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.body,
                  { color: isSelected ? colors.white : colors.text.primary },
                ]}
              >
                {time}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedDay !== null && selectedTimeSlot && (
        <Pressable
          onPress={handleContinue}
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              marginTop: spacing.xl,
            },
          ]}
        >
          <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
            Continue
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Location Selection Step
interface LocationStepProps {
  operatingMode: 'FIXED' | 'MOBILE' | 'HYBRID';
  onSelect: (choice: 'stylist' | 'customer') => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function LocationStep({ operatingMode, onSelect, colors, spacing, borderRadius, shadows }: LocationStepProps) {
  const canVisitStylist = operatingMode === 'FIXED' || operatingMode === 'HYBRID';
  const canHaveStylistVisit = operatingMode === 'MOBILE' || operatingMode === 'HYBRID';

  return (
    <View>
      <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
        Where would you like your appointment?
      </Text>

      {canVisitStylist && (
        <Pressable
          onPress={() => onSelect('stylist')}
          style={[
            styles.locationOption,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.md,
              ...shadows.card,
            },
          ]}
        >
          <View style={[styles.locationIcon, { backgroundColor: colors.tertiary + '20' }]}>
            <VlossomLocationIcon size={24} color={colors.tertiary} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
              Visit the Stylist
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>
              Go to their salon or studio
            </Text>
          </View>
        </Pressable>
      )}

      {canHaveStylistVisit && (
        <Pressable
          onPress={() => onSelect('customer')}
          style={[
            styles.locationOption,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.md,
              ...shadows.card,
            },
          ]}
        >
          <View style={[styles.locationIcon, { backgroundColor: colors.primary + '20' }]}>
            <VlossomLocationIcon size={24} color={colors.primary} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
              Stylist Comes to You
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>
              Service at your location
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

// Confirmation Step
interface ConfirmStepProps {
  stylistName: string;
  service: StylistService;
  date: Date;
  time: string;
  locationChoice: 'stylist' | 'customer';
  balance: { usdc: string; zar: string } | null;
  isLoading: boolean;
  onConfirm: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function ConfirmStep({
  stylistName,
  service,
  date,
  time,
  locationChoice,
  balance,
  isLoading,
  onConfirm,
  colors,
  spacing,
  borderRadius,
  shadows,
}: ConfirmStepProps) {
  const formattedDate = date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Calculate price breakdown
  const servicePriceCents = parseInt(service.priceAmountCents, 10);
  const hasTravelFee = locationChoice === 'customer';
  const priceBreakdown = calculatePriceBreakdown(servicePriceCents, hasTravelFee);
  const balanceUsdcCents = balance ? Math.floor(parseFloat(balance.usdc) * 100) : 0;
  const hasInsufficientBalance = balanceUsdcCents < priceBreakdown.totalAmount;

  return (
    <View>
      <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.lg }]}>
        Confirm Your Booking
      </Text>

      <View
        style={[
          styles.confirmCard,
          {
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.lg,
            ...shadows.card,
          },
        ]}
      >
        <View style={styles.confirmRow}>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>Stylist</Text>
          <Text style={[textStyles.body, { color: colors.text.primary }]}>{stylistName}</Text>
        </View>

        <View style={styles.confirmRow}>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>Service</Text>
          <Text style={[textStyles.body, { color: colors.text.primary }]}>{service.name}</Text>
        </View>

        <View style={styles.confirmRow}>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>Duration</Text>
          <Text style={[textStyles.body, { color: colors.text.primary }]}>
            {service.estimatedDurationMin} minutes
          </Text>
        </View>

        <View style={styles.confirmRow}>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>Date & Time</Text>
          <Text style={[textStyles.body, { color: colors.text.primary }]}>
            {formattedDate} at {time}
          </Text>
        </View>

        <View style={styles.confirmRow}>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>Location</Text>
          <Text style={[textStyles.body, { color: colors.text.primary }]}>
            {locationChoice === 'stylist' ? "Stylist's Location" : 'Your Location'}
          </Text>
        </View>

        <View style={[styles.confirmDivider, { backgroundColor: colors.border.default }]} />

        {/* Price Breakdown */}
        <View style={styles.confirmRow}>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>Service</Text>
          <Text style={[textStyles.body, { color: colors.text.primary }]}>
            {formatPrice(priceBreakdown.serviceAmount)}
          </Text>
        </View>

        {hasTravelFee && (
          <View style={styles.confirmRow}>
            <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>Travel Fee</Text>
            <Text style={[textStyles.body, { color: colors.text.primary }]}>
              {formatPrice(priceBreakdown.travelFee)}
            </Text>
          </View>
        )}

        <View style={[styles.confirmDivider, { backgroundColor: colors.border.default }]} />

        <View style={styles.confirmRow}>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
            Total
          </Text>
          <Text style={[textStyles.h3, { color: colors.primary }]}>
            {formatPrice(priceBreakdown.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Wallet Balance */}
      <View
        style={[
          styles.balanceCard,
          {
            backgroundColor: hasInsufficientBalance ? colors.status.error + '10' : colors.surface.light,
            borderRadius: borderRadius.lg,
            marginTop: spacing.md,
            borderWidth: hasInsufficientBalance ? 1 : 0,
            borderColor: hasInsufficientBalance ? colors.status.error + '30' : 'transparent',
          },
        ]}
      >
        <View style={styles.balanceRow}>
          <VlossomWalletIcon size={20} color={hasInsufficientBalance ? colors.status.error : colors.text.secondary} />
          <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginLeft: spacing.xs }]}>
            Wallet Balance
          </Text>
        </View>
        <Text
          style={[
            textStyles.body,
            {
              color: hasInsufficientBalance ? colors.status.error : colors.text.primary,
              fontWeight: '600',
            },
          ]}
        >
          {balance ? formatPrice(balanceUsdcCents) : 'Loading...'}
        </Text>
        {hasInsufficientBalance && (
          <Text style={[textStyles.caption, { color: colors.status.error, marginTop: spacing.xs }]}>
            Insufficient balance - fund your wallet to proceed
          </Text>
        )}
      </View>

      <Text
        style={[
          textStyles.caption,
          { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
        ]}
      >
        Payment will be held in escrow until service is completed
      </Text>

      <Pressable
        onPress={onConfirm}
        disabled={isLoading}
        style={[
          styles.confirmButton,
          {
            backgroundColor: isLoading ? colors.text.muted : colors.primary,
            borderRadius: borderRadius.lg,
            marginTop: spacing.xl,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
            Confirm Booking
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  progressContainer: {
    paddingVertical: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  serviceCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  dayCard: {
    width: 56,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  continueButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  locationOption: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  confirmCard: {
    padding: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmDivider: {
    height: 1,
    marginVertical: 8,
  },
  confirmButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  balanceCard: {
    padding: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});
