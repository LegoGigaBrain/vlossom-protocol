/**
 * Receive Screen - QR Code Display (V6.8.0)
 *
 * Purpose: Display QR code for receiving payments
 * - Show wallet address as QR code
 * - Optional: Create payment request with specific amount
 * - Copy address to clipboard
 * - Share address/QR
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
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomWalletIcon,
  VlossomAddIcon,
} from '../../src/components/icons/VlossomIcons';
import { useWalletStore } from '../../src/stores/wallet';
import * as Clipboard from 'expo-clipboard';

export default function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const {
    wallet,
    fetchWallet,
    createPaymentRequest,
  } = useWalletStore();

  // Form state
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<{
    id: string;
    qrCodeUrl: string;
    deepLink: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch wallet on mount
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Handle amount input
  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  };

  // Copy address to clipboard
  const handleCopyAddress = useCallback(async () => {
    if (!wallet?.address) return;

    await Clipboard.setStringAsync(wallet.address);
    setCopied(true);

    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  }, [wallet?.address]);

  // Share address
  const handleShareAddress = useCallback(async () => {
    if (!wallet?.address) return;

    try {
      await Share.share({
        message: `My Vlossom wallet address: ${wallet.address}`,
        title: 'Share Wallet Address',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }, [wallet?.address]);

  // Create payment request with specific amount
  const handleCreateRequest = useCallback(async () => {
    if (!amount) return;

    setIsCreatingRequest(true);

    try {
      const result = await createPaymentRequest(amount, memo || undefined);

      if (result) {
        setPaymentRequest({
          id: result.id,
          qrCodeUrl: result.qrCodeUrl,
          deepLink: result.deepLink,
        });
      } else {
        Alert.alert('Error', 'Failed to create payment request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create payment request');
    } finally {
      setIsCreatingRequest(false);
    }
  }, [amount, memo, createPaymentRequest]);

  // Share payment request
  const handleShareRequest = useCallback(async () => {
    if (!paymentRequest) return;

    try {
      await Share.share({
        message: `Pay me $${amount} USDC on Vlossom: ${paymentRequest.deepLink}`,
        title: 'Payment Request',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }, [paymentRequest, amount]);

  // Clear payment request
  const handleClearRequest = () => {
    setPaymentRequest(null);
    setAmount('');
    setMemo('');
  };

  // Format address for display
  const displayAddress = wallet?.address
    ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}`
    : '';

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
        {/* QR Code Display */}
        <View style={[styles.qrSection, { paddingHorizontal: spacing.lg }]}>
          <View
            style={[
              styles.qrContainer,
              {
                backgroundColor: colors.white,
                borderRadius: borderRadius.xl,
                ...shadows.elevated,
              },
            ]}
          >
            {wallet?.address ? (
              <>
                {/* QR Code Placeholder - In production, use react-native-qrcode-svg */}
                <View
                  style={[
                    styles.qrCode,
                    {
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.lg,
                    },
                  ]}
                >
                  {paymentRequest ? (
                    <View style={styles.qrPlaceholder}>
                      <VlossomAddIcon size={48} color={colors.primary} />
                      <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: 8 }]}>
                        Payment Request
                      </Text>
                      <Text style={[textStyles.h3, { color: colors.primary, marginTop: 4 }]}>
                        ${parseFloat(amount).toFixed(2)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <VlossomWalletIcon size={48} color={colors.primary} />
                      <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: 8 }]}>
                        Scan to pay
                      </Text>
                    </View>
                  )}
                </View>

                {/* Address Display */}
                <View style={styles.addressSection}>
                  <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                    Wallet Address
                  </Text>
                  <Text
                    style={[textStyles.mono, styles.address, { color: colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {displayAddress}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsRow, { paddingHorizontal: spacing.lg }]}>
          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: copied ? colors.status.successLight : colors.background.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
            onPress={handleCopyAddress}
            disabled={!wallet?.address}
          >
            <Text
              style={[
                textStyles.body,
                {
                  color: copied ? colors.status.success : colors.text.primary,
                  fontWeight: '600',
                },
              ]}
            >
              {copied ? 'Copied!' : 'Copy Address'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
            onPress={paymentRequest ? handleShareRequest : handleShareAddress}
            disabled={!wallet?.address}
          >
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
              Share
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { paddingHorizontal: spacing.lg }]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border.default }]} />
          <Text style={[textStyles.caption, { color: colors.text.muted, marginHorizontal: 12 }]}>
            or request specific amount
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border.default }]} />
        </View>

        {/* Payment Request Form */}
        {paymentRequest ? (
          <View style={[styles.requestCard, { paddingHorizontal: spacing.lg }]}>
            <View
              style={[
                styles.requestInfo,
                {
                  backgroundColor: colors.status.successLight,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Text style={[textStyles.body, { color: colors.status.success, fontWeight: '600' }]}>
                Payment Request Created
              </Text>
              <Text style={[textStyles.h2, { color: colors.status.success, marginTop: 8 }]}>
                ${parseFloat(amount).toFixed(2)} USDC
              </Text>
              {memo && (
                <Text style={[textStyles.bodySmall, { color: colors.status.success, marginTop: 4 }]}>
                  "{memo}"
                </Text>
              )}

              <Pressable
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: colors.white,
                    borderRadius: borderRadius.md,
                    marginTop: 16,
                  },
                ]}
                onPress={handleClearRequest}
              >
                <Text style={[textStyles.bodySmall, { color: colors.status.success }]}>
                  Create New Request
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
            {/* Amount Input */}
            <Text style={[textStyles.caption, styles.label, { color: colors.text.secondary }]}>
              Amount (USDC)
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
              <Text style={[styles.currencyPrefix, { color: colors.text.primary }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Memo Input */}
            <Text
              style={[
                textStyles.caption,
                styles.label,
                { color: colors.text.secondary, marginTop: 16 },
              ]}
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
                style={[styles.memoInput, { color: colors.text.primary }]}
                value={memo}
                onChangeText={setMemo}
                placeholder="What's this for?"
                placeholderTextColor={colors.text.muted}
                maxLength={100}
              />
            </View>

            {/* Create Request Button */}
            <Pressable
              style={[
                styles.createButton,
                {
                  backgroundColor: amount ? colors.primary : colors.text.muted,
                  borderRadius: borderRadius.lg,
                  ...shadows.soft,
                  marginTop: 24,
                },
              ]}
              onPress={handleCreateRequest}
              disabled={!amount || isCreatingRequest}
            >
              {isCreatingRequest ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                  {amount ? `Request $${parseFloat(amount).toFixed(2)}` : 'Enter Amount'}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Info Note */}
        <View style={[styles.infoNote, { paddingHorizontal: spacing.lg }]}>
          <VlossomWalletIcon size={16} color={colors.text.muted} />
          <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: spacing.xs }]}>
            Only receive USDC on Base network to this address
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
  qrSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  address: {
    marginTop: 4,
    fontSize: 14,
  },
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
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
  memoInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  createButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestCard: {
    marginBottom: 24,
  },
  requestInfo: {
    padding: 20,
    alignItems: 'center',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
