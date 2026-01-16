'use client';

import { useState } from 'react';
import { MessageSquare, RefreshCw, MessageCirclePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function Header() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">ECL Customer Service Dashboard</h1>
              <p className="text-sm text-gray-500">Walmart Marketplace Support</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
            >
              <MessageCirclePlus className="h-4 w-4" />
              <span>Feedback</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">CS</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Staff</span>
            </div>
          </div>
        </div>
      </header>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}
