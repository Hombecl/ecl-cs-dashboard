'use client';

import { useState } from 'react';
import { FeedbackType } from '@/types';
import {
  X, MessageSquare, Bug, Database, FileQuestion,
  HelpCircle, Send, CheckCircle, Loader2
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  relatedCaseId?: string;
}

const feedbackTypes: { type: FeedbackType; icon: React.ReactNode; label: string; description: string }[] = [
  {
    type: 'Feature Request',
    icon: <MessageSquare className="h-5 w-5" />,
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement'
  },
  {
    type: 'Bug Report',
    icon: <Bug className="h-5 w-5" />,
    label: 'Bug Report',
    description: 'Report something that is not working correctly'
  },
  {
    type: 'Data Issue',
    icon: <Database className="h-5 w-5" />,
    label: 'Data Issue',
    description: 'Report incorrect or missing data'
  },
  {
    type: 'Case Issue',
    icon: <FileQuestion className="h-5 w-5" />,
    label: 'Case Issue',
    description: 'Report a problem with a specific case'
  },
  {
    type: 'Other',
    icon: <HelpCircle className="h-5 w-5" />,
    label: 'Other',
    description: 'General feedback or questions'
  }
];

export default function FeedbackModal({ isOpen, onClose, relatedCaseId }: FeedbackModalProps) {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [caseId, setCaseId] = useState(relatedCaseId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setSubmittedBy('');
    setCaseId(relatedCaseId || '');
    setIsSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedType || !title.trim() || !description.trim() || !submittedBy.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          submittedBy: submittedBy.trim(),
          relatedCaseId: caseId.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error || 'Failed to submit feedback');
      }
    } catch {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Submit Feedback</h2>
            <p className="text-sm text-gray-500">Help us improve the CS Dashboard</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isSubmitted ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Feedback Submitted!
              </h3>
              <p className="text-gray-500 mb-6">
                Thank you for your feedback. We will review it and take action as needed.
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          ) : (
            // Form
            <div className="space-y-6">
              {/* Feedback Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of feedback? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {feedbackTypes.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setSelectedType(item.type)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition text-left ${
                        selectedType === item.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`${selectedType === item.type ? 'text-blue-600' : 'text-gray-400'}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className={`font-medium ${selectedType === item.type ? 'text-blue-900' : 'text-gray-900'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide as much detail as possible. For bugs, include steps to reproduce."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Related Case ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Case/Order # <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="e.g., 123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submitted By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
