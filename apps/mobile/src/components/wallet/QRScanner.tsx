/**
 * QR Scanner Component (V6.10.0)
 *
 * Modal component for scanning QR codes containing wallet addresses.
 * Uses expo-camera with barcode scanning.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useTheme, textStyles } from '../../styles/theme';
import { VlossomCloseIcon } from '../icons/VlossomIcons';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (address: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

export function QRScanner({ visible, onClose, onScan }: QRScannerProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Reset scanned state when modal opens
  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  // Handle barcode scanned
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;

    const { data } = result;

    // Check if it's a valid Ethereum address or payment request URL
    let address = data;

    // Handle ethereum: URI scheme
    if (data.startsWith('ethereum:')) {
      address = data.replace('ethereum:', '').split('@')[0].split('?')[0];
    }

    // Handle vlossom: URI scheme
    if (data.startsWith('vlossom://pay?')) {
      const url = new URL(data);
      address = url.searchParams.get('to') || '';
    }

    // Validate address format
    if (address.startsWith('0x') && address.length === 42) {
      setScanned(true);
      onScan(address);
      onClose();
    }
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <View style={styles.permissionContent}>
            <Text style={[textStyles.h3, { color: colors.text.primary, textAlign: 'center' }]}>
              Camera Permission Required
            </Text>
            <Text
              style={[
                textStyles.body,
                { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md },
              ]}
            >
              We need camera access to scan QR codes for wallet addresses.
            </Text>
            <Pressable
              style={[
                styles.permissionButton,
                { backgroundColor: colors.primary, borderRadius: borderRadius.lg },
              ]}
              onPress={requestPermission}
            >
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                Grant Permission
              </Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top */}
          <View style={[styles.overlaySection, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

          {/* Middle row */}
          <View style={styles.middleRow}>
            {/* Left */}
            <View style={[styles.overlaySection, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

            {/* Scan area */}
            <View style={[styles.scanArea, { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE }]}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.primary }]} />
            </View>

            {/* Right */}
            <View style={[styles.overlaySection, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          </View>

          {/* Bottom */}
          <View style={[styles.overlaySection, styles.bottomSection, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Text style={[textStyles.body, { color: colors.white, textAlign: 'center', marginTop: spacing.xl }]}>
              Position the QR code within the frame
            </Text>
            <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: spacing.sm }]}>
              Scanning for wallet address...
            </Text>
          </View>
        </View>

        {/* Close button */}
        <Pressable
          style={[
            styles.closeIconButton,
            { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: borderRadius.circle },
          ]}
          onPress={onClose}
        >
          <VlossomCloseIcon size={24} color={colors.white} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    padding: 24,
    alignItems: 'center',
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 24,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySection: {
    flex: 1,
  },
  middleRow: {
    flexDirection: 'row',
  },
  scanArea: {
    position: 'relative',
  },
  bottomSection: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  closeIconButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
