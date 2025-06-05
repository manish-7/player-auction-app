import React, { useState } from 'react';
import { Share2, Copy, Users, AlertCircle, ExternalLink } from 'lucide-react';

interface ShareAuctionDemoProps {
  isVisible: boolean;
  onClose: () => void;
}

const ShareAuctionDemo: React.FC<ShareAuctionDemoProps> = ({ isVisible, onClose }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const basePath = import.meta.env.BASE_URL || '/';
  const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const demoUrl = `${window.location.origin}${cleanBasePath}/auction/live/demo-abc123xyz`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(demoUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Live Auction Sharing
          </h3>
          <p className="text-gray-600 mb-4">
            Share your auction in real-time with multiple viewers!
          </p>
          
          {/* Firebase Setup Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">
                  Firebase Setup Required
                </h4>
                <p className="text-sm text-amber-700 mb-2">
                  To enable live sharing, you need to configure Firebase Realtime Database.
                </p>
                <a
                  href="/FIREBASE_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-amber-800 hover:text-amber-900 font-medium"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Setup Guide
                </a>
              </div>
            </div>
          </div>

          {/* Demo URL */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600 mb-2">Demo Share Link:</div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={demoUrl}
                readOnly
                className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1 text-gray-800"
              />
              <button
                onClick={handleCopyUrl}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  copySuccess
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                }`}
              >
                {copySuccess ? (
                  <>✓ Copied</>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1 inline" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Features List */}
          <div className="text-left bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              🚀 Live Sharing Features:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Real-time auction updates</li>
              <li>• Multiple viewers can watch simultaneously</li>
              <li>• Live bid updates and player progression</li>
              <li>• Team roster updates in real-time</li>
              <li>• Mobile-friendly viewer interface</li>
              <li>• Free tier supports 100+ concurrent viewers</li>
            </ul>
          </div>

          {/* Viewer Count Demo */}
          <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
            <Users className="w-4 h-4 mr-1" />
            <span>0 viewers watching (demo mode)</span>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.open('/FIREBASE_SETUP.md', '_blank')}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Setup Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareAuctionDemo;
