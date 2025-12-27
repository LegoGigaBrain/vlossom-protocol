/**
 * Send Screen - P2P Transfer (V6.10.0)
 *
 * Purpose: Send USDC to another wallet address
 * - Enter recipient address or scan QR code
 * - Enter USDC amount
 * - Optional memo/note
 * - Biometric auth required before proceeding
 * - Execute transfer via API
 *
 * V6.10: Added QR scanner for scanning wallet addresses
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
import {
  VlossomWalletIcon,
  VlossomSearchIcon,
} from '../../src/components/icons/VlossomIcons';
import { useWalletStore } from '../../src/stores/wallet';
import { useBiometricAuth, getBiometricTypeName } from '../../src/hooks/useBiometricAuth';
import { colors as tokenColors } from '../../src/styles/tokens';
import { QRScanner } from '../../src/components/wallet';

// Transfer limits
const MIN_AMOUNT_USDC = 0.01;
const NETWORK_FEE_USDC = 0; // Gasless transfers

export default function SendScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const {
    balance,
    sendLoading,
    sendError,
    send,
    fetchBalance,
    clearSendError,
  } = useWalletStore();

  const {
    isAvailable: biometricAvailable,
    biometricType,
    authenticate,
  } = useBiometricAuth();

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Handle QR code scan result
  const handleScanResult = useCallback((address: string) => {
    setRecipient(address);
  }, []);

  // Refresh balance on mount
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Clear errors on unmount
  useEffect(() => {
    return () => clearSendError();
  }, [clearSendError]);

  // Parse amount as number
  const amountNumber = parseFloat(amount) || 0;
  const availableBalance = parseFloat(balance?.usdc || '0');

  // Validation
  const isValidAddress = recipient.length === 42 && recipient.startsWith('0x');
  const isValidAmount =
    amountNumber >= MIN_AMOUNT_USDC && amountNumber <= availableBalance;
  const canProceed = isValidAddress && isValidAmount && !sendLoading && !isProcessing;

  // Handle amount input
  const handleAmountChange = (text: string) => {
    // Only allow numbers and single decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 6) return; // USDC has 6 decimals
    setAmount(cleaned);
  };

  // Handle address input
  const handleAddressChange = (text: string) => {
    // Trim whitespace and convert to lowercase
    setRecipient(text.trim());
  };

  // Set max amount
  const handleMax = () => {
    setAmount(availableBalance.toFixed(2));
  };

  // Quick amount buttons
  const quickAmounts = [10, 25, 50, 100];

  // Handle send
  const handleSend = useCallback(async () => {
    if (!canProceed) return;

    // Require biometric authentication
    if (biometricAvailable) {
      const authenticated = await authenticate({
        promptMessage: `Authenticate to send $${amountNumber.toFixed(2)}`,
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
      const success = await send({
        toAddress: recipient,
        amount: amount,
        memo: memo || undefined,
      });

      if (success) {
        Alert.alert(
          'Transfer Successful',
          `You sent $${amountNumber.toFixed(2)} USDC to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
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
    biometricAvailable,
    authenticate,
    amountNumber,
    send,
    recipient,
    amount,
    memo,
    router,
  ]);

  // Get validation error messages
  const getAddressError = () => {
    if (!recipient) return null;
    if (!recipient.startsWith('0x')) {
      return 'Address must start with 0x';
    }
    if (recipient.length !== 42) {
      return 'Invalid address length';
    }
    return null;
  };

  const getAmountError = () => {
    if (!amount) return null;
    if (amountNumber < MIN_AMOUNT_USDC) {
      return `Minimum amount is $${MIN_AMOUNT_USDC}`;
    }
    if (amountNumber > availableBalance) {
      return 'Insufficient balance';
    }
    return null;
  };

  const addressError = getAddressError();
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
          accessibilityLabel={`Available balance: ${balance?.usdcFormatted || '0.00'} dollars USDC`}
        >
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
            Available Balance
          </Text>
          <Text style={[styles.balanceAmount, { color: colors.text.primary }]}>
            ${balance?.usdcFormatted || '0.00'}
          </Text>
        </View>

        {/* Error Banner */}
        {sendError && (
          <View
            style={[styles.errorBanner, { backgroundColor: colors.status.errorLight }]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={[textStyles.bodySmall, { color: colors.status.error }]}>
              {sendError}
            </Text>
          </View>
        )}

        {/* Recipient Address */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}
            nativeID="recipientLabel"
          >
            Recipient Address
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                borderColor: addressError ? colors.status.error : colors.border.default,
                borderWidth: 1,
              },
            ]}
          >
            <TextInput
              style={[styles.addressInput, { color: colors.text.primary }]}
              value={recipient}
              onChangeText={handleAddressChange}
              placeholder="0x..."
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Recipient wallet address"
              accessibilityLabelledBy="recipientLabel"
              accessibilityHint="Enter the wallet address starting with 0x, or tap scan to use camera"
            />
            <Pressable
              style={styles.scanButton}
              onPress={() => setShowScanner(true)}
              accessibilityRole="button"
              accessibilityLabel="Scan QR code"
              accessibilityHint="Double tap to open camera and scan a wallet QR code"
            >
              <VlossomSearchIcon size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Validation message */}
          {addressError && (
            <Text
              style={[textStyles.caption, styles.errorText, { color: colors.status.error }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {addressError}
            </Text>
          )}
        </View>

        {/* Amount Input */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.labelRow}>
            <Text
              style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}
              nativeID="amountLabel"
            >
              Amount (USDC)
            </Text>
            <Pressable
              onPress={handleMax}
              accessibilityRole="button"
              accessibilityLabel={`Use maximum amount: ${availableBalance.toFixed(2)} dollars`}
              accessibilityHint="Double tap to set the amount to your full balance"
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
              style={[styles.amountInput, { color: colors.text.primary }]}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              accessibilityLabel="Amount in dollars"
              accessibilityLabelledBy="amountLabel"
              accessibilityHint={`Enter amount to send. Minimum ${MIN_AMOUNT_USDC} dollars, maximum ${availableBalance.toFixed(2)} dollars`}
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

          {/* Quick amount buttons */}
          <View style={styles.quickAmounts} accessibilityRole="radiogroup" accessibilityLabel="Quick amount selection">
            {quickAmounts.map((quickAmount) => {
              const isSelected = amountNumber === quickAmount;
              const isDisabled = quickAmount > availableBalance;
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
                  disabled={isDisabled}
                  accessibilityRole="radio"
                  accessibilityLabel={`${quickAmount} dollars${isDisabled ? ', unavailable, exceeds balance' : ''}`}
                  accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                >
                  <Text
                    style={[
                      textStyles.bodySmall,
                      {
                        color: isDisabled
                          ? colors.text.muted
                          : isSelected
                            ? colors.white
                            : colors.text.primary,
                      },
                    ]}
                  >
                    ${quickAmount}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Memo (Optional) */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}
            nativeID="memoLabel"
          >
            Note (Optional)
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
              style={[styles.addressInput, { color: colors.text.primary }]}
              value={memo}
              onChangeText={setMemo}
              placeholder="What's this for?"
              placeholderTextColor={colors.text.muted}
              maxLength={100}
              accessibilityLabel="Note or memo for this transfer"
              accessibilityLabelledBy="memoLabel"
              accessibilityHint="Optional. Add a note to remember what this transfer is for"
            />
          </View>
        </View>

        {/* Summary */}
        {isValidAddress && amountNumber > 0 && (
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
              accessibilityLabel={`Transfer summary: Sending ${amountNumber.toFixed(2)} dollars to ${recipient.slice(0, 8)}...${recipient.slice(-6)}. Network fee: Free`}
            >
              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary }]}>Sending</Text>
                <Text
                  style={[
                    textStyles.h3,
                    { color: colors.text.primary, fontWeight: '700' },
                  ]}
                >
                  ${amountNumber.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary }]}>
                  Network Fee
                </Text>
                <Text style={[textStyles.body, { color: tokenColors.status.success }]}>
                  FREE
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

              <View style={styles.summaryRow}>
                <Text style={[textStyles.body, { color: colors.text.secondary }]}>To</Text>
                <Text style={[textStyles.mono, { color: colors.text.primary }]}>
                  {recipient.slice(0, 8)}...{recipient.slice(-6)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Biometric Info */}
        {biometricAvailable && (
          <View
            style={[styles.biometricInfo, { paddingHorizontal: spacing.lg }]}
            accessible
            accessibilityLabel={`${getBiometricTypeName(biometricType)} authentication will be required to confirm this transfer`}
          >
            <Text style={[textStyles.caption, { color: colors.text.muted, textAlign: 'center' }]}>
              {getBiometricTypeName(biometricType)} will be required to confirm this transfer
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
            onPress={handleSend}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityLabel={
              sendLoading || isProcessing
                ? 'Processing transfer'
                : isValidAddress && isValidAmount
                  ? `Send ${amountNumber.toFixed(2)} dollars`
                  : 'Enter transfer details'
            }
            accessibilityState={{ disabled: !canProceed }}
            accessibilityHint={canProceed ? 'Double tap to send the transfer' : 'Fill in all required fields to enable'}
          >
            {sendLoading || isProcessing ? (
              <ActivityIndicator color={colors.white} accessibilityLabel="Processing" />
            ) : (
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                {isValidAddress && isValidAmount
                  ? `Send $${amountNumber.toFixed(2)}`
                  : 'Enter Details'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Gasless Note */}
        <View
          style={[styles.securityNote, { paddingHorizontal: spacing.lg }]}
          accessible
          accessibilityLabel="Transfers are gasless, no network fees"
        >
          <VlossomWalletIcon size={16} color={colors.text.muted} />
          <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: spacing.xs }]}>
            Transfers are gasless - no network fees!
          </Text>
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
      />
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
  addressInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  scanButton: {
    padding: 8,
    marginLeft: 8,
  },
  currencyPrefix: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  amountInput: {
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
