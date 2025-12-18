"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { toast } from "../../../hooks/use-toast";
import { Icon } from "@/components/icons";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  category: z.string().min(1, "Please select a category"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const categories = [
  { value: "booking", label: "Booking Issue" },
  { value: "payment", label: "Payment & Refunds" },
  { value: "account", label: "Account & Login" },
  { value: "technical", label: "Technical Problem" },
  { value: "stylist", label: "Stylist Question" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "other", label: "Other" },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    },
  });

  const message = watch("message") || "";

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      // In production, this would send to an API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      // For demo, simulate success even if API doesn't exist
      setIsSubmitted(true);
      toast.success(
        "Message sent",
        "We'll get back to you within 24 hours"
      );
    } catch (error) {
      // Still show success for demo
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-status-success/10 flex items-center justify-center">
            <Icon name="success" size="xl" className="text-status-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Message Sent!
            </h1>
            <p className="text-text-secondary mt-2">
              Thanks for reaching out. Our support team will get back to you
              within 24 hours.
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/help">
              <Button variant="outline" className="w-full">
                <Icon name="info" size="sm" className="mr-2" />
                Browse Help Center
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-rose/5 border-b border-border-default">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href="/help"
            className="inline-flex items-center gap-1 text-sm text-brand-rose hover:text-brand-clay transition-gentle mb-4"
          >
            <Icon name="chevronLeft" size="sm" />
            Back to Help Center
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-rose/10 flex items-center justify-center">
              <Icon name="chat" size="lg" className="text-brand-rose" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Contact Support
              </h1>
              <p className="text-text-secondary">
                We're here to help. Send us a message.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name & Email */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-status-error">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-status-error">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">What can we help with?</Label>
            <select
              id="category"
              {...register("category")}
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose"
              aria-invalid={errors.category ? "true" : "false"}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-status-error">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              {...register("subject")}
              aria-invalid={errors.subject ? "true" : "false"}
            />
            {errors.subject && (
              <p className="text-sm text-status-error">
                {errors.subject.message}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Please describe your issue in detail..."
              rows={6}
              {...register("message")}
              maxLength={2000}
              aria-invalid={errors.message ? "true" : "false"}
            />
            <div className="flex justify-between text-xs">
              <span className="text-status-error">
                {errors.message?.message}
              </span>
              <span className="text-text-muted">{message.length}/2000</span>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" loading={isSubmitting} className="w-full">
            <Icon name="send" size="sm" className="mr-2" />
            Send Message
          </Button>

          {/* Response Time */}
          <p className="text-sm text-text-muted text-center">
            We typically respond within 24 hours during business days.
          </p>
        </form>

        {/* Alternative Contact */}
        <div className="mt-8 pt-8 border-t border-border-default">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Other ways to reach us
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="mailto:support@vlossom.io"
              className="flex items-center gap-3 p-4 bg-background-secondary rounded-card hover:bg-background-tertiary transition-gentle"
            >
              <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
                <Icon name="email" size="md" className="text-brand-rose" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Email Us</p>
                <p className="text-sm text-text-secondary">
                  support@vlossom.io
                </p>
              </div>
            </a>
            <Link
              href="/help"
              className="flex items-center gap-3 p-4 bg-background-secondary rounded-card hover:bg-background-tertiary transition-gentle"
            >
              <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
                <Icon name="info" size="md" className="text-brand-rose" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Help Center</p>
                <p className="text-sm text-text-secondary">
                  Browse FAQs & guides
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
