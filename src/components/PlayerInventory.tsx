import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Image } from 'lucide-react';
import { useAuctionStore } from '../store/auctionStore';
import { readExcelFile, validatePlayerData, generateSampleExcelFile, formatCurrency } from '../utils/excelUtils';
import { imageCacheService } from '../services/imageCacheService';
import type { Player } from '../types';

interface PlayerInventoryProps {
  onNext: () => void;
  onBack: () => void;
}

const PlayerInventory: React.FC<PlayerInventoryProps> = ({ onNext, onBack }) => {
  const { setPlayers, tournament } = useAuctionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    validPlayers: Player[];
    captains: Player[];
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imagePreloadProgress, setImagePreloadProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsLoading(true);
    setValidationResult(null);

    try {
      const excelData = await readExcelFile(file);
      const minimumBid = tournament?.settings.minimumBid || 100;
      const numberOfTeams = tournament?.numberOfTeams || 4;
      const validation = validatePlayerData(excelData, minimumBid, numberOfTeams);
      setValidationResult(validation);

      // Preload images if validation is successful
      if (validation.isValid && validation.validPlayers.length > 0) {
        const playersWithImages = validation.validPlayers.filter(p => p.imageUrl);
        if (playersWithImages.length > 0) {
          console.log(`Starting to preload ${playersWithImages.length} player images...`);
          setImagePreloadProgress({ loaded: 0, total: playersWithImages.length });

          try {
            await imageCacheService.preloadPlayerImages(
              validation.validPlayers,
              (loaded, total) => {
                setImagePreloadProgress({ loaded, total });
              }
            );
            console.log('All player images preloaded successfully!');
          } catch (error) {
            console.warn('Some images failed to preload:', error);
          } finally {
            setImagePreloadProgress(null);
          }
        }
      }
    } catch (error) {
      alert('Error reading Excel file: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleConfirmPlayers = () => {
    if (validationResult?.validPlayers) {
      setPlayers(validationResult.validPlayers);
      onNext();
    }
  };

  const handleDownloadSample = () => {
    const minimumBid = tournament?.settings.minimumBid || 100;
    generateSampleExcelFile(minimumBid);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Player Inventory
          </h2>
          <p className="text-gray-600">
            Upload an Excel file containing player information for the auction.
          </p>
        </div>

        {/* Tournament Info */}
        {tournament && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Tournament: {tournament.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Teams:</span>
                <span className="ml-2 font-medium">{tournament.numberOfTeams}</span>
              </div>
              <div>
                <span className="text-gray-500">Players/Team:</span>
                <span className="ml-2 font-medium">{tournament.playersPerTeam}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Players Needed:</span>
                <span className="ml-2 font-medium">{tournament.numberOfTeams * tournament.playersPerTeam}</span>
              </div>
              <div>
                <span className="text-gray-500">Budget/Team:</span>
                <span className="ml-2 font-medium">{formatCurrency(tournament.teamBudget)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sample File Download */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadSample}
              className="btn-secondary inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample Excel File
            </button>
            <button
              onClick={async () => {
                // Load sample data for testing
                setIsLoading(true);
                try {
                  const { samplePlayers } = await import('../utils/testData');
                  const minimumBid = tournament?.settings.minimumBid || 100;
                  // Update sample players to use tournament's minimum bid for players without base price
                  const updatedPlayers = samplePlayers.map(player => ({
                    ...player,
                    basePrice: player.basePrice || minimumBid
                  }));

                  // Extract captains from sample data
                  const captains = updatedPlayers.filter(p => p.isCaptain);

                  setValidationResult({
                    isValid: true,
                    errors: [],
                    validPlayers: updatedPlayers,
                    captains,
                  });

                  // Preload sample images
                  const playersWithImages = updatedPlayers.filter(p => p.imageUrl);
                  if (playersWithImages.length > 0) {
                    console.log(`Preloading ${playersWithImages.length} sample player images...`);
                    setImagePreloadProgress({ loaded: 0, total: playersWithImages.length });

                    try {
                      await imageCacheService.preloadPlayerImages(
                        updatedPlayers,
                        (loaded, total) => {
                          setImagePreloadProgress({ loaded, total });
                        }
                      );
                      console.log('Sample images preloaded successfully!');
                    } catch (error) {
                      console.warn('Some sample images failed to preload:', error);
                    } finally {
                      setImagePreloadProgress(null);
                    }
                  }
                } catch (error) {
                  console.error('Error loading sample data:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="btn-primary inline-flex items-center"
              disabled={isLoading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Load Sample Data (For Testing)
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Download a sample Excel file to see the required format, or load sample data for quick testing.
          </p>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Player Excel File
          </h3>
          <p className="text-gray-500 mb-4">
            Drag and drop your Excel file here, or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center"
            disabled={isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? 'Processing...' : 'Choose File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="mt-6">
            {validationResult.isValid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-900">
                    Validation Successful!
                  </h4>
                </div>
                <p className="text-green-800 mb-4">
                  Found {validationResult.validPlayers.length} valid players ready for auction.
                  {validationResult.captains.length > 0 && (
                    <span className="block mt-1">
                      Captains identified: {validationResult.captains.map(c => c.name).join(', ')}
                    </span>
                  )}
                </p>

                {/* Image Preload Progress */}
                {imagePreloadProgress && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                    <div className="flex items-center mb-2">
                      <Image className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">
                        Loading player images... ({imagePreloadProgress.loaded}/{imagePreloadProgress.total})
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(imagePreloadProgress.loaded / imagePreloadProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Player Summary */}
                <div className="bg-white rounded border p-4 mb-4">
                  <h5 className="font-medium mb-3">Player Summary by Role:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(role => {
                      const count = validationResult.validPlayers.filter(p => p.role === role || (!p.role && role === 'Batsman')).length;
                      return (
                        <div key={role}>
                          <span className="text-gray-600">{role}:</span>
                          <span className="ml-2 font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleConfirmPlayers}
                  className="btn-success"
                >
                  Confirm & Continue to Team Setup
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h4 className="font-medium text-red-900">
                    Validation Failed
                  </h4>
                </div>
                <p className="text-red-800 mb-4">
                  Please fix the following errors and upload again:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Required Format Info */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Required Excel Format:</h4>
          <div className="text-sm text-yellow-800">
            <p className="mb-2">Your Excel file must contain the following columns:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Player Name</strong> (Required): Full name of the player</li>
              <li><strong>Role</strong> (Optional): Batsman, Bowler, All-Rounder, or Wicket-Keeper (default: Batsman)</li>
              <li><strong>Base Price</strong> (Optional): Starting price in currency units (default: {formatCurrency(tournament?.settings.minimumBid || 100)})</li>
              <li><strong>Rating</strong> (Optional): Player skill rating from 0-100</li>
              <li><strong>Image URL</strong> (Optional): Direct link to player's photo (e.g., https://example.com/player.jpg)</li>
              <li><strong>Captain</strong> (Optional): Mark as captain with "yes" (exactly {tournament?.numberOfTeams || 4} captains required)</li>
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
          <button onClick={onBack} className="btn-secondary">
            Back to Tournament Setup
          </button>
          {validationResult?.isValid && (
            <button onClick={handleConfirmPlayers} className="btn-primary">
              Next: Team Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerInventory;
