/**
 * Admin Dispute Detail Page
 * V3.4: View and manage a specific dispute
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Badge } from "../../../../components/ui/badge";
import { Label } from "../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { toast } from "../../../../hooks/use-toast";
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

interface DisputeMessage {
  id: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  attachmentUrls: string[];
  createdAt: string;
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface Dispute {
  id: string;
  bookingId: string;
  type: string;
  status: string;
  priority: number;
  title: string;
  description: string;
  evidenceUrls: string[];
  createdAt: string;
  updatedAt: string;
  assignedToId: string | null;
  assignedAt: string | null;
  resolution: string | null;
  resolutionNotes: string | null;
  refundPercent: number | null;
  resolvedAt: string | null;
  escalatedAt: string | null;
  escalationReason: string | null;
  filedBy?: {
    id: string;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
  };
  filedAgainst?: {
    id: string;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
  };
  assignedTo?: {
    id: string;
    displayName: string;
  } | null;
  booking?: {
    id: string;
    status: string;
    scheduledStartTime: string;
    quoteAmountCents: number;
  };
  messages?: DisputeMessage[];
}

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-purple-100 text-purple-800",
  RESOLVED: "bg-green-100 text-green-800",
  ESCALATED: "bg-red-100 text-red-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const resolutionOptions = [
  { value: "FULL_REFUND_CUSTOMER", label: "Full Refund to Customer" },
  { value: "PARTIAL_REFUND", label: "Partial Refund" },
  { value: "NO_REFUND", label: "No Refund (Favor Stylist)" },
  { value: "SPLIT_FUNDS", label: "Split Funds" },
  { value: "STYLIST_PENALTY", label: "Stylist Penalty" },
  { value: "CUSTOMER_WARNING", label: "Customer Warning" },
  { value: "MUTUAL_CANCELLATION", label: "Mutual Cancellation" },
  { value: "ESCALATED_TO_LEGAL", label: "Escalate to Legal" },
];

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions state
  const [isAssigning, setIsAssigning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Forms
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundPercent, setRefundPercent] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isInternalMessage, setIsInternalMessage] = useState(false);

  const fetchDispute = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/admin/disputes/${disputeId}`);
      setDispute(response.dispute);
    } catch (err) {
      setError("Failed to load dispute");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [disputeId]);

  const handleAssignToMe = async () => {
    setIsAssigning(true);
    try {
      // Get current admin ID (in a real app, from auth context)
      const adminId = "current-admin-id"; // Placeholder
      await api.post(`/admin/disputes/${disputeId}/assign`, {
        assignedToId: adminId,
      });
      toast.success("Dispute assigned", "You have been assigned to this dispute.");
      fetchDispute();
    } catch (err) {
      toast.error("Assignment failed", "Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStartReview = async () => {
    try {
      await api.post(`/admin/disputes/${disputeId}/review`, {});
      toast.success("Review started", "Dispute is now under review.");
      fetchDispute();
    } catch (err) {
      toast.error("Action failed", "Please try again.");
    }
  };

  const handleResolve = async () => {
    if (!resolution || !resolutionNotes) {
      toast.error("Missing fields", "Please fill in all required fields.");
      return;
    }

    if (resolution === "PARTIAL_REFUND" && !refundPercent) {
      toast.error("Refund percent required", "Please specify the refund percentage.");
      return;
    }

    setIsResolving(true);
    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`, {
        resolution,
        resolutionNotes,
        refundPercent: refundPercent ? parseInt(refundPercent) : undefined,
      });
      toast.success("Dispute resolved", "The dispute has been resolved.");
      setShowResolveForm(false);
      fetchDispute();
    } catch (err) {
      toast.error("Resolution failed", "Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason) {
      toast.error("Reason required", "Please provide an escalation reason.");
      return;
    }

    setIsEscalating(true);
    try {
      await api.post(`/admin/disputes/${disputeId}/escalate`, {
        escalationReason,
      });
      toast.success("Dispute escalated", "The dispute has been escalated.");
      setShowEscalateForm(false);
      fetchDispute();
    } catch (err) {
      toast.error("Escalation failed", "Please try again.");
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      await api.post(`/admin/disputes/${disputeId}/messages`, {
        content: newMessage,
        isInternal: isInternalMessage,
      });
      setNewMessage("");
      toast.success("Message sent", "Your message has been added.");
      fetchDispute();
    } catch (err) {
      toast.error("Failed to send", "Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleClose = async () => {
    try {
      await api.post(`/admin/disputes/${disputeId}/close`, {});
      toast.success("Dispute closed", "The dispute has been closed.");
      fetchDispute();
    } catch (err) {
      toast.error("Failed to close", "Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
          <p className="mt-4 text-red-600">{error || "Dispute not found"}</p>
          <Link href="/admin/disputes">
            <Button className="mt-4" variant="outline">
              Back to Disputes
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/disputes" className="flex items-center text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Disputes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={statusColors[dispute.status] || "bg-gray-100"}>
              {dispute.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline">
              Priority: {dispute.priority}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{dispute.title}</h1>
          <p className="text-gray-500">
            Dispute #{dispute.id.slice(0, 8)} • Filed{" "}
            {new Date(dispute.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{dispute.description}</p>
            </CardContent>
          </Card>

          {/* Evidence */}
          {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Evidence ({dispute.evidenceUrls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dispute.evidenceUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-lg bg-gray-100 overflow-hidden hover:opacity-75 transition-opacity"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Discussion ({dispute.messages?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              {dispute.messages && dispute.messages.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {dispute.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.isInternal
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.author?.avatarUrl || undefined} />
                          <AvatarFallback>
                            {message.author?.displayName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {message.author?.displayName || "Unknown"}
                            </span>
                            {message.isInternal && (
                              <Badge className="text-xs bg-yellow-200 text-yellow-800">
                                Internal
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No messages yet</p>
              )}

              {/* New Message Form */}
              <div className="pt-4 border-t">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternalMessage}
                        onChange={(e) => setIsInternalMessage(e.target.checked)}
                        className="rounded"
                      />
                      Internal note (not visible to parties)
                    </label>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSendingMessage}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Show different actions based on status */}
              {dispute.status === "OPEN" && (
                <Button
                  className="w-full"
                  onClick={handleAssignToMe}
                  loading={isAssigning}
                >
                  Assign to Me
                </Button>
              )}

              {dispute.status === "ASSIGNED" && (
                <Button className="w-full" onClick={handleStartReview}>
                  Start Review
                </Button>
              )}

              {["ASSIGNED", "UNDER_REVIEW"].includes(dispute.status) && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowResolveForm(true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve Dispute
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive-outline"
                    onClick={() => setShowEscalateForm(true)}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Escalate
                  </Button>
                </>
              )}

              {dispute.status === "RESOLVED" && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleClose}
                >
                  Close Dispute
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Resolution Form */}
          {showResolveForm && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Resolve Dispute</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Resolution Type</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {resolution === "PARTIAL_REFUND" && (
                  <div className="space-y-2">
                    <Label>Refund Percentage</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={refundPercent}
                      onChange={(e) => setRefundPercent(e.target.value)}
                      placeholder="e.g., 50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Resolution Notes</Label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Explain the reasoning for this resolution..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleResolve}
                    loading={isResolving}
                  >
                    Confirm Resolution
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowResolveForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Escalation Form */}
          {showEscalateForm && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Escalate Dispute</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Escalation Reason</Label>
                  <Textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Why does this need escalation?"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={handleEscalate}
                    loading={isEscalating}
                  >
                    Confirm Escalation
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowEscalateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parties Involved */}
          <Card>
            <CardHeader>
              <CardTitle>Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Filed By</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={dispute.filedBy?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {dispute.filedBy?.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {dispute.filedBy?.displayName || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dispute.filedBy?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Filed Against</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={dispute.filedAgainst?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {dispute.filedAgainst?.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {dispute.filedAgainst?.displayName || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dispute.filedAgainst?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Info */}
          {dispute.booking && (
            <Card>
              <CardHeader>
                <CardTitle>Related Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge>{dispute.booking.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>
                    {new Date(dispute.booking.scheduledStartTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span>
                    R{(dispute.booking.quoteAmountCents / 100).toFixed(2)}
                  </span>
                </div>
                <Link
                  href={`/admin/bookings/${dispute.bookingId}`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  View Booking <ExternalLink className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Resolution Info (if resolved) */}
          {dispute.resolution && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Decision</span>
                  <Badge className="bg-green-200 text-green-800">
                    {dispute.resolution.replace(/_/g, " ")}
                  </Badge>
                </div>
                {dispute.refundPercent && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refund</span>
                    <span>{dispute.refundPercent}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved</span>
                  <span>
                    {dispute.resolvedAt
                      ? new Date(dispute.resolvedAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                {dispute.resolutionNotes && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-sm">{dispute.resolutionNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
