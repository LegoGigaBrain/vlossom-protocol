/**
 * Services Management Page
 * Reference: docs/specs/stylist-dashboard/F3.3-services-management.md
 */

"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { ServiceList } from "../../../../components/dashboard/service-list";
import { ServiceFormDialog, DeleteServiceDialog } from "../../../../components/dashboard/service-dialog";
import {
  useStylistServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "../../../../hooks/use-dashboard";
import type { StylistService, CreateServiceInput } from "../../../../lib/dashboard-client";

export default function ServicesPage() {
  const { data, isLoading, error } = useStylistServices();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<StylistService | null>(null);

  const handleAddNew = () => {
    setSelectedService(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (service: StylistService) => {
    setSelectedService(service);
    setFormDialogOpen(true);
  };

  const handleToggle = (service: StylistService) => {
    updateMutation.mutate({
      id: service.id,
      input: { isActive: !service.isActive },
    });
  };

  const handleDeleteClick = (service: StylistService) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = (data: CreateServiceInput) => {
    if (selectedService) {
      updateMutation.mutate(
        { id: selectedService.id, input: data },
        {
          onSuccess: () => setFormDialogOpen(false),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormDialogOpen(false),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedService) {
      deleteMutation.mutate(selectedService.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedService(null);
        },
      });
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 text-text-primary">My Services</h1>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <p className="text-body text-status-error">Failed to load services</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">My Services</h1>
          <p className="text-body text-text-secondary">
            Manage your service offerings
          </p>
        </div>
        <Button variant="primary" onClick={handleAddNew}>
          + Add Service
        </Button>
      </div>

      {/* Services List */}
      <ServiceList
        services={data?.services || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggle={handleToggle}
        onDelete={handleDeleteClick}
      />

      {/* Form Dialog */}
      <ServiceFormDialog
        service={selectedService}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteServiceDialog
        service={selectedService}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
