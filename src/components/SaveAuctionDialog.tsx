import React, { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';

interface SaveAuctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentName: string;
  isCompleted?: boolean;
}

const SaveAuctionDialog: React.FC<SaveAuctionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  isCompleted = false,
}) => {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a name for the auction');
      return;
    }

    if (trimmedName.length < 3) {
      setError('Auction name must be at least 3 characters long');
      return;
    }

    onSave(trimmedName);
    onClose();
    setName('');
    setError('');
  };

  const handleClose = () => {
    onClose();
    setName(currentName);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Save className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">
                  {isCompleted ? 'Save Completed Auction' : 'Save Auction Progress'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {isCompleted 
                    ? 'Save the final results for future reference'
                    : 'Save current progress to resume later'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="auction-name" className="block text-sm font-medium text-gray-700 mb-2">
                Auction Name
              </label>
              <input
                id="auction-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a name for this auction..."
                autoFocus
              />
              {error && (
                <div className="mt-2 flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            {!isCompleted && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Saving Incomplete Auction</p>
                    <p>
                      You can resume this auction later from the same point. All current bids, 
                      team budgets, and player states will be preserved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Auction</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveAuctionDialog;
