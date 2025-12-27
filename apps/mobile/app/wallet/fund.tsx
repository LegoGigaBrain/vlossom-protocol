/**
 * Fund Screen - Kotani Pay Onramp (V6.8.0)
 *
 * Purpose: Add money to wallet via Kotani Pay
 * - Enter ZAR amount
 * - View real-time exchange rate
 * - See estimated USDC to receive
 * - Biometric auth required before proceeding
 * - Initiate onramp via Kotani Pay
 *
 * V7.2.0: Added accessibility labels for screen reader support
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomWalletIcon, VlossomAddIcon } from '../../src/components/icons/VlossomIcons';
import { useWalletStore } from '../../src/stores/wallet';
import { useBiometricAuth, getBiometricTypeName } from '../../src/hooks/useBiometricAuth';
import { colors as tokenColors } from '../../src/styles/tokens';

// Kotani Pay limits
const MIN_AMOUNT_ZAR = 50;
const MAX_AMOUNT_ZAR = 50000;
const FEE_PERCENTAGE = 0.02; // 2%
const NETWORK_FEE_ZAR = 0.5;

export default function FundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const {
    fiatConfig,
    exchangeRate,
    fundLoading,
    fundError,
    fetchFiatConfig,
    fetchExchangeRate,
    fund,
    clearFundError,
  } = useWalletStore();

  const {
    isAvailable: biometricAvailable,
    biometricType,
    authenticate,
    isLoading: biometricLoading,
  } = useBiometricAuth();

  // Form state
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'bank_transfer' | 'mobile_money'>('bank_transfer');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load fiat config and exchange rate on mount
  useEffect(() => {
    fetchFiatConfig();
    fetchExchangeRate();
  }, [fetchFiatConfig, fetchExchangeRate]);

  // Clear errors on unmount
  useEffect(() => {
    return () => clearFundError();
  }, [clearFundError]);

  // Parse amount as number
  const amountNumber = parseFloat(amount) || 0;

  // Calculate fees and estimated USDC
  const feeAmount = amountNumber * FEE_PERCENTAGE + NETWORK_FEE_ZAR;
  const netAmount = Math.max(0, amountNumber - feeAmount);
  const estimatedUsdc = exchangeRate ? netAmount / exchangeRate.buyRate : 0;

  // Validation
  const isValidAmount = amountNumber >= MIN_AMOUNT_ZAR && amountNumber <= MAX_AMOUNT_ZAR;
  const canProceed = isValidAmount && !fundLoading && !isProcessing;

  // Handle amount input
  const handleAmountChange = (text: string) => {
    // Only allow numbers and single decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  };

  // Quick amount buttons
  const quickAmounts = [100, 500, 1000, 5000];

  // Handle fund initiation
  const handleFund = useCallback(async () => {
    if (!canProceed) return;

    // Require biometric authentication
    if (biometricAvailable) {
      const authenticated = await authenticate({
        promptMessage: `Authenticate to add R${amountNumber.toFixed(2)} to your wallet`,
      });

      if (!authenticated) {
        Alert.alert(
          'Authentication Required',
          'Please authenticate to continue with this transaction.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setIsProcessing(true);

    try {
      const result = await fund({
        amount: amountNumber,
        currency: 'ZAR',
        paymentMethod: selectedMethod,
      });

      if (result) {
        // Show success and open payment URL if provided
        if (result.paymentUrl) {
          Alert.alert(
            'Payment Ready',
            `Reference: ${result.reference}\n\nYou'll be redirected to complete your payment.`,
            [
              {
                text: 'Continue',
                onPress: () => Linking.openURL(result.paymentUrl!),
              },
            ]
          );
        } else if (result.paymentInstructions) {
          Alert.alert(
            'Payment Instructions',
            `Reference: ${result.reference}\n\n${result.paymentInstructions}`,
            [{ text: 'Done', onPress: () => router.back() }]
          );
        } else {
          Alert.alert(
            'Success',
            `Your funding request has been initiated.\nReference: ${result.reference}`,
            [{ text: 'Done', onPress: () => router.back() }]
          );
        }
      }
    } catch (error) {
      // Error is handled by the store
    } finally {
      setIsProcessing(false);
    }
  }, [canProceed, biometricAvailable, authenticate, amountNumber, selectedMethod, fund, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Icon */}
        <View
          style={[styles.iconContainer, { backgroundColor: colors.primarySoft }]}
          accessible
          accessibilityRole="header"
        >
          <VlossomAddIcon size={32} color={colors.primary} />
        </View>

        <Text
          style={[textStyles.h3, styles.title, { color: colors.text.primary }]}
          accessibilityRole="header"
        >
          Add Money to Wallet
        </Text>
        <Text style={[textStyles.body, styles.subtitle, { color: colors.text.secondary }]}>
          Fund your wallet using ZAR via Kotani Pay
        </Text>

        {/* Error Banner */}
        {fundError && (
          <View
            style={[styles.errorBanner, { backgroundColor: colors.status.errorLight }]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={[textStyles.bodySmall, { color: colors.status.error }]}>
              {fundError}
            </Text>
          </View>
        )}

        {/* Amount Input */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}
            nativeID="fundAmountLabel"
          >
            Amount (ZAR)
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                borderColor: isValidAmount || !amount ? colors.border.default : colors.status.error,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: colors.text.primary }]} aria-hidden>R</Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              autoFocus
              accessibilityLabel="Amount in South African Rand"
              accessibilityLabelledBy="fundAmountLabel"
              accessibilityHint={`Enter amount between R${MIN_AMOUNT_ZAR} and R${MAX_AMOUNT_ZAR.toLocaleString()}`}
            />
          </View>

          {/* Validation message */}
          {amount && !isValidAmount && (
            <Text
              style={[textStyles.caption, styles.errorText, { color: colors.status.error }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {amountNumber < MIN_AMOUNT_ZAR
                ? `Minimum amount is R${MIN_AMOUNT_ZAR}`
                : `Maximum amount is R${MAX_AMOUNT_ZAR.toLocaleString()}`}
            </Text>
          )}

          {/* Quick amount buttons */}
          <View style={styles.quickAmounts} accessibilityRole="radiogroup" accessibilityLabel="Quick amount selection">
            {quickAmounts.map((quickAmount) => {
              const isSelected = amountNumber === quickAmount;
              return (
                <Pressable
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={() => setAmount(quickAmount.toString())}
                  accessibilityRole="radio"
                  accessibilityLabel={`${quickAmount.toLocaleString()} Rand`}
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text
                    style={[
                      textStyles.bodySmall,
                      {
                        color: isSelected ? colors.white : colors.text.primary,
                      },
                    ]}
                  >
                    R{quickAmount.toLocaleString()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}>
            Payment Method
          </Text>
          <View style={styles.methodOptions} accessibilityRole="radiogroup" accessibilityLabel="Payment method selection">
            <Pressable
              style={[
                styles.methodOption,
                {
                  backgroundColor:
                    selectedMethod === 'bank_transfer'
                      ? colors.primarySoft
                      : colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  borderColor:
                    selectedMethod === 'bank_transfer'
                      ? colors.primary
                      : colors.border.default,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setSelectedMethod('bank_transfer')}
              accessibilityRole="radio"
              accessibilityLabel="Bank Transfer, EFT or instant payment"
              accessibilityState={{ checked: selectedMethod === 'bank_transfer' }}
            >
              <Text
                style={[
                  textStyles.body,
                  {
                    color:
                      selectedMethod === 'bank_transfer'
                        ? colors.primary
                        : colors.text.primary,
                    fontWeight: selectedMethod === 'bank_transfer' ? '600' : '400',
                  },
                ]}
              >
                Bank Transfer
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                EFT or instant payment
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.methodOption,
                {
                  backgroundColor:
                    selectedMethod === 'mobile_money'
                      ? colors.primarySoft
                      : colors.background.secondary,
                  borderRadius: borderRadius.lg,
                  borderColor:
                    selectedMethod === 'mobile_money'
                      ? colors.primary
                      : colors.border.default,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setSelectedMethod('mobile_money')}
              accessibilityRole="radio"
              accessibilityLabel="Mobile Money, M-Pesa, MTN, and others"
              accessibilityState={{ checked: selectedMethod === 'mobile_money' }}
            >
              <Text
                style={[
                  textStyles.body,
                  {
                    color:
                      selectedMethod === 'mobile_money'
                        ? colors.primary
                        : colors.text.primary,
                    fontWeight: selectedMethod === 'mobile_money' ? '600' : '400',
                  },
                ]}
              >
                Mobile Money
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                M-Pesa, MTN, etc.
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Summary */}
        {amountNumber > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                },
              ]}
              accessible
              accessibilityRole="summary"
              accessibilityLabel={
                exchangeRate
                  ? `Funding summary: Amount R${amountNumber.toFixed(2)}, Fee R${feeAmount.toFixed(2)}, You receive ${estimatedUsdc.toFixed(2)} dollars USDC. Exchange rate: 1 USD equals R${exchangeRate.buyRate.toFixed(2)}`
                  : `Funding summary: Amount R${amountNumber.toFixed(2)}, Fee R${feeAmount.toFixed(2)}, Loading exchange rate`
              }
            >
              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary }]}>
                  Amount
                </Text>
                <Text style={[textStyles.body, { color: colors.text.primary }]}>
                  R{amountNumber.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary }]}>
                  Fee (2% + R0.50)
                </Text>
                <Text style={[textStyles.body, { color: colors.status.error }]}>
                  -R{feeAmount.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary, fontWeight: '600' }]}>
                  You receive
                </Text>
                <View style={styles.receiveAmount}>
                  {exchangeRate ? (
                    <>
                      <Text
                        style={[
                          textStyles.h3,
                          { color: tokenColors.status.success, fontWeight: '700' },
                        ]}
                      >
                        ${estimatedUsdc.toFixed(2)}
                      </Text>
                      <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                        USDC
                      </Text>
                    </>
                  ) : (
                    <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Loading exchange rate" />
                  )}
                </View>
              </View>

              {exchangeRate && (
                <Text style={[textStyles.caption, styles.rateText, { color: colors.text.muted }]}>
                  Rate: 1 USD = R{exchangeRate.buyRate.toFixed(2)} ZAR
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Biometric Info */}
        {biometricAvailable && (
          <View
            style={[styles.biometricInfo, { paddingHorizontal: spacing.lg }]}
            accessible
            accessibilityLabel={`${getBiometricTypeName(biometricType)} authentication will be required to confirm this transaction`}
          >
            <Text style={[textStyles.caption, { color: colors.text.muted, textAlign: 'center' }]}>
              {getBiometricTypeName(biometricType)} will be required to confirm this transaction
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <View style={[styles.buttonContainer, { paddingHorizontal: spacing.lg }]}>
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: canProceed ? colors.primary : colors.text.muted,
                borderRadius: borderRadius.lg,
                ...shadows.soft,
              },
            ]}
            onPress={handleFund}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityLabel={
              fundLoading || isProcessing
                ? 'Processing'
                : isValidAmount
                  ? `Add R${amountNumber.toFixed(2)} to wallet`
                  : 'Enter a valid amount'
            }
            accessibilityState={{ disabled: !canProceed }}
            accessibilityHint={canProceed ? 'Double tap to initiate funding' : 'Enter a valid amount first'}
          >
            {fundLoading || isProcessing ? (
              <ActivityIndicator color={colors.white} accessibilityLabel="Processing" />
            ) : (
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                {isValidAmount ? `Add R${amountNumber.toFixed(2)}` : 'Enter Amount'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Security Note */}
        <View
          style={[styles.securityNote, { paddingHorizontal: spacing.lg }]}
          accessible
          accessibilityLabel="Secured by Kotani Pay. Funds typically arrive within minutes."
        >
          <VlossomWalletIcon size={16} color={colors.text.muted} />
          <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: spacing.xs }]}>
            Secured by Kotani Pay. Funds typically arrive within minutes.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
  },
  title: {
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  currencyPrefix: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
  },
  errorText: {
    marginTop: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  methodOptions: {
    gap: 12,
  },
  methodOption: {
    padding: 16,
  },
  summaryCard: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  receiveAmount: {
    alignItems: 'flex-end',
  },
  rateText: {
    textAlign: 'center',
    marginTop: 8,
  },
  biometricInfo: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  submitButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
