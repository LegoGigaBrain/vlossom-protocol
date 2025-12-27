/**
 * Withdraw Screen - Kotani Pay Offramp (V6.8.0)
 *
 * Purpose: Withdraw funds from wallet via Kotani Pay
 * - Enter USDC amount
 * - View real-time exchange rate
 * - See estimated ZAR to receive
 * - Select bank account
 * - Biometric auth required before proceeding
 * - Initiate offramp via Kotani Pay
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomWalletIcon } from '../../src/components/icons/VlossomIcons';
import { useWalletStore } from '../../src/stores/wallet';
import { useBiometricAuth, getBiometricTypeName } from '../../src/hooks/useBiometricAuth';
import { colors as tokenColors } from '../../src/styles/tokens';

// Kotani Pay offramp limits
const MIN_AMOUNT_USDC = 5;
const MAX_AMOUNT_USDC = 5000;
const FEE_PERCENTAGE = 0.02; // 2%
const NETWORK_FEE_USDC = 0.50;

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const {
    balance,
    fiatConfig,
    exchangeRate,
    withdrawLoading,
    withdrawError,
    fetchFiatConfig,
    fetchExchangeRate,
    withdraw,
    clearWithdrawError,
  } = useWalletStore();

  const {
    isAvailable: biometricAvailable,
    biometricType,
    authenticate,
  } = useBiometricAuth();

  // Form state
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load fiat config and exchange rate on mount
  useEffect(() => {
    fetchFiatConfig();
    fetchExchangeRate(100, 'sell'); // Get sell rate for offramp
  }, [fetchFiatConfig, fetchExchangeRate]);

  // Clear errors on unmount
  useEffect(() => {
    return () => clearWithdrawError();
  }, [clearWithdrawError]);

  // Parse amount as number
  const amountNumber = parseFloat(amount) || 0;
  const availableBalance = parseFloat(balance?.usdc || '0');

  // Calculate fees and estimated ZAR
  const feeAmount = amountNumber * FEE_PERCENTAGE + NETWORK_FEE_USDC;
  const netAmount = Math.max(0, amountNumber - feeAmount);
  const estimatedZar = exchangeRate ? netAmount * exchangeRate.sellRate : 0;

  // Validation
  const isValidAmount =
    amountNumber >= MIN_AMOUNT_USDC &&
    amountNumber <= MAX_AMOUNT_USDC &&
    amountNumber <= availableBalance;
  const hasValidBank = selectedBank && accountNumber.length >= 8;
  const canProceed = isValidAmount && hasValidBank && !withdrawLoading && !isProcessing;

  // Handle amount input
  const handleAmountChange = (text: string) => {
    // Only allow numbers and single decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  };

  // Handle account number input
  const handleAccountNumberChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setAccountNumber(cleaned);
  };

  // Set max amount
  const handleMax = () => {
    const maxWithdrawable = Math.min(availableBalance, MAX_AMOUNT_USDC);
    setAmount(maxWithdrawable.toFixed(2));
  };

  // Banks available for withdrawal
  const banks = fiatConfig?.banks || [
    { code: 'ABSA', name: 'ABSA Bank' },
    { code: 'FNB', name: 'First National Bank' },
    { code: 'NED', name: 'Nedbank' },
    { code: 'STD', name: 'Standard Bank' },
    { code: 'CAP', name: 'Capitec Bank' },
  ];

  // Handle withdraw initiation
  const handleWithdraw = useCallback(async () => {
    if (!canProceed || !selectedBank) return;

    // Require biometric authentication
    if (biometricAvailable) {
      const authenticated = await authenticate({
        promptMessage: `Authenticate to withdraw $${amountNumber.toFixed(2)}`,
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
      const result = await withdraw({
        amount: amountNumber,
        currency: 'ZAR',
        bankCode: selectedBank,
        accountNumber,
      });

      if (result) {
        Alert.alert(
          'Withdrawal Initiated',
          `Your withdrawal of $${amountNumber.toFixed(2)} (≈R${estimatedZar.toFixed(2)}) has been initiated.\n\nReference: ${result.reference}\n\nFunds typically arrive within 1-3 business days.`,
          [{ text: 'Done', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      // Error is handled by the store
    } finally {
      setIsProcessing(false);
    }
  }, [
    canProceed,
    selectedBank,
    biometricAvailable,
    authenticate,
    amountNumber,
    withdraw,
    accountNumber,
    estimatedZar,
    router,
  ]);

  // Get validation error message
  const getAmountError = () => {
    if (!amount) return null;
    if (amountNumber < MIN_AMOUNT_USDC) {
      return `Minimum withdrawal is $${MIN_AMOUNT_USDC}`;
    }
    if (amountNumber > MAX_AMOUNT_USDC) {
      return `Maximum withdrawal is $${MAX_AMOUNT_USDC.toLocaleString()}`;
    }
    if (amountNumber > availableBalance) {
      return 'Insufficient balance';
    }
    return null;
  };

  const amountError = getAmountError();

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
        {/* Header with Balance */}
        <View
          style={[styles.balanceCard, { backgroundColor: colors.background.secondary }]}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Available balance: ${balance?.usdcFormatted || '0.00'} dollars USDC${balance?.fiatValue ? `, approximately R${balance.fiatValue.toFixed(2)} ZAR` : ''}`}
        >
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
            Available Balance
          </Text>
          <Text style={[styles.balanceAmount, { color: colors.text.primary }]}>
            ${balance?.usdcFormatted || '0.00'}
          </Text>
          {balance?.fiatValue && (
            <Text style={[textStyles.bodySmall, { color: colors.text.muted }]}>
              ≈ R{balance.fiatValue.toFixed(2)} ZAR
            </Text>
          )}
        </View>

        {/* Error Banner */}
        {withdrawError && (
          <View
            style={[styles.errorBanner, { backgroundColor: colors.status.errorLight }]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={[textStyles.bodySmall, { color: colors.status.error }]}>
              {withdrawError}
            </Text>
          </View>
        )}

        {/* Amount Input */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.labelRow}>
            <Text
              style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}
              nativeID="withdrawAmountLabel"
            >
              Amount (USDC)
            </Text>
            <Pressable
              onPress={handleMax}
              accessibilityRole="button"
              accessibilityLabel={`Use maximum amount: ${Math.min(availableBalance, MAX_AMOUNT_USDC).toFixed(2)} dollars`}
              accessibilityHint="Double tap to set the amount to your maximum withdrawable balance"
            >
              <Text style={[textStyles.caption, { color: colors.primary }]}>Max</Text>
            </Pressable>
          </View>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                borderColor: amountError ? colors.status.error : colors.border.default,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: colors.text.primary }]} aria-hidden>$</Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              accessibilityLabel="Withdrawal amount in dollars"
              accessibilityLabelledBy="withdrawAmountLabel"
              accessibilityHint={`Enter amount between $${MIN_AMOUNT_USDC} and $${MAX_AMOUNT_USDC.toLocaleString()}`}
            />
          </View>

          {/* Validation message */}
          {amountError && (
            <Text
              style={[textStyles.caption, styles.errorText, { color: colors.status.error }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {amountError}
            </Text>
          )}
        </View>

        {/* Bank Selection */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}>
            Select Bank
          </Text>
          <View style={styles.bankGrid} accessibilityRole="radiogroup" accessibilityLabel="Bank selection">
            {banks.map((bank) => {
              const isSelected = selectedBank === bank.code;
              return (
                <Pressable
                  key={bank.code}
                  style={[
                    styles.bankOption,
                    {
                      backgroundColor: isSelected ? colors.primarySoft : colors.background.secondary,
                      borderRadius: borderRadius.md,
                      borderColor: isSelected ? colors.primary : colors.border.default,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setSelectedBank(bank.code)}
                  accessibilityRole="radio"
                  accessibilityLabel={bank.name}
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text
                    style={[
                      textStyles.bodySmall,
                      {
                        color: isSelected ? colors.primary : colors.text.primary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {bank.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Account Number */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}
            nativeID="accountNumberLabel"
          >
            Account Number
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                borderColor: colors.border.default,
                borderWidth: 1,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              placeholder="Enter your account number"
              placeholderTextColor={colors.text.muted}
              keyboardType="number-pad"
              maxLength={16}
              accessibilityLabel="Bank account number"
              accessibilityLabelledBy="accountNumberLabel"
              accessibilityHint="Enter your bank account number, minimum 8 digits"
            />
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
                  ? `Withdrawal summary: Amount ${amountNumber.toFixed(2)} dollars, Fee ${feeAmount.toFixed(2)} dollars, You receive R${estimatedZar.toFixed(2)} ZAR. Exchange rate: 1 USD equals R${exchangeRate.sellRate.toFixed(2)}`
                  : `Withdrawal summary: Amount ${amountNumber.toFixed(2)} dollars, Fee ${feeAmount.toFixed(2)} dollars, Loading exchange rate`
              }
            >
              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary }]}>
                  Withdrawal Amount
                </Text>
                <Text style={[textStyles.body, { color: colors.text.primary }]}>
                  ${amountNumber.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary }]}>
                  Fee (2% + $0.50)
                </Text>
                <Text style={[textStyles.body, { color: colors.status.error }]}>
                  -${feeAmount.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

              <View style={styles.summaryRow}>
                <Text
                  style={[textStyles.body, { color: colors.text.secondary, fontWeight: '600' }]}
                >
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
                        R{estimatedZar.toFixed(2)}
                      </Text>
                      <Text style={[textStyles.caption, { color: colors.text.muted }]}>ZAR</Text>
                    </>
                  ) : (
                    <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Loading exchange rate" />
                  )}
                </View>
              </View>

              {exchangeRate && (
                <Text style={[textStyles.caption, styles.rateText, { color: colors.text.muted }]}>
                  Rate: 1 USD = R{exchangeRate.sellRate.toFixed(2)} ZAR
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
            onPress={handleWithdraw}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityLabel={
              withdrawLoading || isProcessing
                ? 'Processing withdrawal'
                : isValidAmount && hasValidBank
                  ? `Withdraw ${amountNumber.toFixed(2)} dollars`
                  : 'Complete all details to withdraw'
            }
            accessibilityState={{ disabled: !canProceed }}
            accessibilityHint={canProceed ? 'Double tap to initiate withdrawal' : 'Fill in all required fields first'}
          >
            {withdrawLoading || isProcessing ? (
              <ActivityIndicator color={colors.white} accessibilityLabel="Processing" />
            ) : (
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                {isValidAmount && hasValidBank
                  ? `Withdraw $${amountNumber.toFixed(2)}`
                  : 'Complete Details'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Security Note */}
        <View
          style={[styles.securityNote, { paddingHorizontal: spacing.lg }]}
          accessible
          accessibilityLabel="Withdrawals typically arrive within 1 to 3 business days"
        >
          <VlossomWalletIcon size={16} color={colors.text.muted} />
          <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: spacing.xs }]}>
            Withdrawals typically arrive within 1-3 business days.
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
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: '45%',
    flexGrow: 1,
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
