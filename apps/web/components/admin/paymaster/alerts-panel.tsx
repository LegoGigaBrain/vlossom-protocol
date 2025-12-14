"use client";

import { useState } from "react";
import { Bell, Settings } from "lucide-react";

interface AlertConfig {
  type: "LOW_BALANCE" | "HIGH_USAGE" | "ERROR_RATE";
  threshold: number;
  isActive: boolean;
  notifySlack: boolean;
  notifyEmail: boolean;
  emailRecipients?: string;
}

interface AlertsPanelProps {
  alerts: AlertConfig[] | null;
  isLoading: boolean;
  onUpdateAlert?: (config: AlertConfig) => Promise<void>;
}

/**
 * Alerts Panel Component (F5.1)
 * Displays and manages alert configurations
 */
export function AlertsPanel({
  alerts,
  isLoading,
  onUpdateAlert,
}: AlertsPanelProps) {
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!alerts) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts</h3>
        <p className="text-gray-500">Failed to load alerts</p>
      </div>
    );
  }

  const alertTypeLabels: Record<string, string> = {
    LOW_BALANCE: "Low Balance",
    HIGH_USAGE: "High Usage",
    ERROR_RATE: "Error Rate",
  };

  const alertTypeDescriptions: Record<string, string> = {
    LOW_BALANCE: "Triggers when paymaster balance falls below threshold (ETH)",
    HIGH_USAGE: "Triggers when 24h gas cost exceeds threshold (ETH)",
    ERROR_RATE: "Triggers when error rate exceeds threshold (%)",
  };

  const handleSave = async () => {
    if (!editingAlert || !onUpdateAlert) return;

    setIsSaving(true);
    try {
      await onUpdateAlert(editingAlert);
      setEditingAlert(null);
    } catch (error) {
      console.error("Failed to update alert:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Alert Settings</h3>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {alerts.map((alert) => (
          <div key={alert.type} className="p-6">
            {editingAlert?.type === alert.type ? (
              // Edit mode
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {alertTypeLabels[alert.type]}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {alertTypeDescriptions[alert.type]}
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingAlert.isActive}
                      onChange={(e) =>
                        setEditingAlert({
                          ...editingAlert,
                          isActive: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAlert.threshold}
                    onChange={(e) =>
                      setEditingAlert({
                        ...editingAlert,
                        threshold: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingAlert.notifySlack}
                      onChange={(e) =>
                        setEditingAlert({
                          ...editingAlert,
                          notifySlack: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Slack</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingAlert.notifyEmail}
                      onChange={(e) =>
                        setEditingAlert({
                          ...editingAlert,
                          notifyEmail: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                </div>

                {editingAlert.notifyEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Recipients (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editingAlert.emailRecipients || ""}
                      onChange={(e) =>
                        setEditingAlert({
                          ...editingAlert,
                          emailRecipients: e.target.value,
                        })
                      }
                      placeholder="admin@vlossom.io, ops@vlossom.io"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingAlert(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">
                      {alertTypeLabels[alert.type]}
                    </h4>
                    {alert.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Threshold: {alert.threshold}
                    {alert.type === "ERROR_RATE" ? "%" : " ETH"}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {alert.notifySlack && (
                      <span className="text-xs text-gray-500">Slack</span>
                    )}
                    {alert.notifyEmail && (
                      <span className="text-xs text-gray-500">Email</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingAlert({ ...alert })}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
