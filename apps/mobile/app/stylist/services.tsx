/**
 * Stylist Services Management (V7.2.0)
 *
 * Manage services offered by the stylist:
 * - List all services with prices
 * - Add new services
 * - Edit/delete existing services
 * - Toggle service availability
 *
 * V7.2.0: Full accessibility support with semantic roles
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomAddIcon,
} from '../../src/components/icons/VlossomIcons';
import { Card, Button, Modal, TextInput, Select } from '../../src/components/ui';
import { formatPrice } from '../../src/api/stylists';

// Service categories
const SERVICE_CATEGORIES = [
  { label: 'Braids & Locs', value: 'BRAIDS' },
  { label: 'Natural Hair', value: 'NATURAL' },
  { label: 'Weaves & Wigs', value: 'WEAVES' },
  { label: 'Color & Treatments', value: 'COLOR' },
  { label: 'Nails', value: 'NAILS' },
  { label: 'Makeup & Lashes', value: 'MAKEUP' },
  { label: 'Barbering', value: 'BARBER' },
];

interface Service {
  id: string;
  name: string;
  category: string;
  priceAmountCents: number;
  durationMinutes: number;
  description: string;
  isActive: boolean;
}

// Mock services for demo
const MOCK_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Knotless Braids',
    category: 'BRAIDS',
    priceAmountCents: 45000,
    durationMinutes: 240,
    description: 'Medium-sized knotless box braids',
    isActive: true,
  },
  {
    id: '2',
    name: 'Loc Retwist',
    category: 'BRAIDS',
    priceAmountCents: 20000,
    durationMinutes: 90,
    description: 'Retwist and style existing locs',
    isActive: true,
  },
  {
    id: '3',
    name: 'Passion Twists',
    category: 'BRAIDS',
    priceAmountCents: 35000,
    durationMinutes: 180,
    description: 'Bohemian passion twist style',
    isActive: true,
  },
  {
    id: '4',
    name: 'Natural Hair Styling',
    category: 'NATURAL',
    priceAmountCents: 25000,
    durationMinutes: 60,
    description: 'Wash, condition, and style natural hair',
    isActive: false,
  },
];

export default function StylistServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();

  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    duration: '',
    description: '',
  });

  const handleBack = () => {
    router.back();
  };

  const handleToggleActive = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const handleAddService = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: '',
    });
    setEditingService(null);
    setShowAddModal(true);
  };

  const handleEditService = (service: Service) => {
    setFormData({
      name: service.name,
      category: service.category,
      price: (service.priceAmountCents / 100).toString(),
      duration: service.durationMinutes.toString(),
      description: service.description,
    });
    setEditingService(service);
    setShowAddModal(true);
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setServices((prev) => prev.filter((s) => s.id !== service.id));
          },
        },
      ]
    );
  };

  const handleSaveService = () => {
    if (!formData.name || !formData.category || !formData.price || !formData.duration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const serviceData: Service = {
      id: editingService?.id || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      priceAmountCents: parseFloat(formData.price) * 100,
      durationMinutes: parseInt(formData.duration),
      description: formData.description,
      isActive: editingService?.isActive ?? true,
    };

    if (editingService) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? serviceData : s))
      );
    } else {
      setServices((prev) => [...prev, serviceData]);
    }

    setShowAddModal(false);
    setEditingService(null);
  };

  const getCategoryLabel = (value: string) => {
    return SERVICE_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const activeServices = services.filter((s) => s.isActive);
  const inactiveServices = services.filter((s) => !s.isActive);

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
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to stylist dashboard"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.h3, { color: colors.text.primary }]}
          accessibilityRole="header"
        >
          My Services
        </Text>
        <Pressable
          onPress={handleAddService}
          accessibilityRole="button"
          accessibilityLabel="Add new service"
          accessibilityHint="Double tap to add a new service to your offerings"
        >
          <VlossomAddIcon size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Services */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}
            accessibilityRole="header"
          >
            Active Services ({activeServices.length})
          </Text>

          <View accessibilityRole="list" accessibilityLabel={`Active services, ${activeServices.length} items`}>
            {activeServices.map((service) => (
              <Card
                key={service.id}
                variant="outlined"
                style={{ marginBottom: spacing.sm }}
                onPress={() => handleEditService(service)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${service.name}, ${getCategoryLabel(service.category)}, ${formatDuration(service.durationMinutes)}, ${formatPrice(service.priceAmountCents)}, ${service.isActive ? 'active' : 'inactive'}`}
                accessibilityHint="Double tap to edit this service"
              >
                <View style={styles.serviceRow} aria-hidden>
                  <View style={styles.serviceInfo}>
                    <Text
                      style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}
                    >
                      {service.name}
                    </Text>
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      {getCategoryLabel(service.category)} • {formatDuration(service.durationMinutes)}
                    </Text>
                  </View>
                  <View style={styles.serviceActions}>
                    <Text
                      style={[textStyles.body, { color: colors.primary, fontWeight: '600', marginRight: spacing.sm }]}
                    >
                      {formatPrice(service.priceAmountCents)}
                    </Text>
                    <Switch
                      value={service.isActive}
                      onValueChange={() => handleToggleActive(service.id)}
                      trackColor={{ false: colors.border.default, true: colors.primary + '60' }}
                      thumbColor={service.isActive ? colors.primary : colors.text.muted}
                      accessibilityLabel={`${service.name} availability toggle`}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: service.isActive }}
                      accessibilityHint={service.isActive ? 'Double tap to deactivate this service' : 'Double tap to activate this service'}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>

          {activeServices.length === 0 && (
            <Card variant="filled">
              <View
                style={styles.emptyState}
                accessible
                accessibilityLabel="No active services. Add a service to start receiving bookings."
              >
                <Text style={[textStyles.body, { color: colors.text.secondary }]} aria-hidden>
                  No active services
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: 4 }]} aria-hidden>
                  Add a service to start receiving bookings
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Inactive Services */}
        {inactiveServices.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
            <Text
              style={[textStyles.h4, { color: colors.text.secondary, marginBottom: spacing.sm }]}
              accessibilityRole="header"
            >
              Inactive Services ({inactiveServices.length})
            </Text>

            <View accessibilityRole="list" accessibilityLabel={`Inactive services, ${inactiveServices.length} items`}>
              {inactiveServices.map((service) => (
                <Card
                  key={service.id}
                  variant="outlined"
                  style={{ marginBottom: spacing.sm, opacity: 0.6 }}
                  onPress={() => handleEditService(service)}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`${service.name}, ${getCategoryLabel(service.category)}, ${formatDuration(service.durationMinutes)}, ${formatPrice(service.priceAmountCents)}, inactive`}
                  accessibilityHint="Double tap to edit this service"
                >
                  <View style={styles.serviceRow} aria-hidden>
                    <View style={styles.serviceInfo}>
                      <Text style={[textStyles.body, { color: colors.text.secondary }]}>
                        {service.name}
                      </Text>
                      <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                        {getCategoryLabel(service.category)} • {formatDuration(service.durationMinutes)}
                      </Text>
                    </View>
                    <View style={styles.serviceActions}>
                      <Text
                        style={[textStyles.body, { color: colors.text.muted, marginRight: spacing.sm }]}
                      >
                        {formatPrice(service.priceAmountCents)}
                      </Text>
                      <Switch
                        value={service.isActive}
                        onValueChange={() => handleToggleActive(service.id)}
                        trackColor={{ false: colors.border.default, true: colors.primary + '60' }}
                        thumbColor={service.isActive ? colors.primary : colors.text.muted}
                        accessibilityLabel={`${service.name} availability toggle`}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: service.isActive }}
                        accessibilityHint="Double tap to activate this service"
                      />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Add Service Button */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Button
            title="Add New Service"
            variant="secondary"
            fullWidth
            onPress={handleAddService}
            leftIcon={<VlossomAddIcon size={20} color={colors.primary} />}
            accessibilityLabel="Add New Service"
            accessibilityHint="Double tap to add a new service to your offerings"
          />
        </View>
      </ScrollView>

      {/* Add/Edit Service Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingService ? 'Edit Service' : 'Add Service'}
        accessibilityLabel={editingService ? `Edit ${editingService.name} service` : 'Add new service'}
        footer={
          <View style={styles.modalFooter}>
            {editingService && (
              <Button
                title="Delete"
                variant="danger"
                onPress={() => {
                  setShowAddModal(false);
                  handleDeleteService(editingService);
                }}
                style={{ marginRight: spacing.sm }}
                accessibilityLabel={`Delete ${editingService.name}`}
                accessibilityHint="Double tap to delete this service"
              />
            )}
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowAddModal(false)}
              style={{ flex: 1, marginRight: spacing.sm }}
              accessibilityLabel="Cancel"
              accessibilityHint="Double tap to close without saving"
            />
            <Button
              title="Save"
              variant="primary"
              onPress={handleSaveService}
              style={{ flex: 1 }}
              accessibilityLabel="Save service"
              accessibilityHint="Double tap to save service details"
            />
          </View>
        }
      >
        <TextInput
          label="Service Name"
          placeholder="e.g., Knotless Braids"
          value={formData.name}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
          accessibilityLabel="Service Name"
          accessibilityHint="Enter the name of your service"
        />

        <Select
          label="Category"
          placeholder="Select category"
          options={SERVICE_CATEGORIES}
          value={formData.category}
          onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          accessibilityLabel="Category"
          accessibilityHint="Select the category for this service"
        />

        <TextInput
          label="Price (ZAR)"
          placeholder="e.g., 450"
          keyboardType="number-pad"
          value={formData.price}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text }))}
          leftIcon={<Text style={{ color: '#666' }}>R</Text>}
          accessibilityLabel="Price in Rands"
          accessibilityHint="Enter the price for this service"
        />

        <TextInput
          label="Duration (minutes)"
          placeholder="e.g., 120"
          keyboardType="number-pad"
          value={formData.duration}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, duration: text }))}
          accessibilityLabel="Duration in minutes"
          accessibilityHint="Enter how long this service takes"
        />

        <TextInput
          label="Description (optional)"
          placeholder="Brief description of the service"
          multiline
          numberOfLines={3}
          value={formData.description}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
          accessibilityLabel="Description, optional"
          accessibilityHint="Enter a brief description of this service"
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  modalFooter: {
    flexDirection: 'row',
  },
});
