import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuctionStore } from '../store/auctionStore';
import { formatCurrency } from '../utils/excelUtils';

interface TournamentFormData {
  name: string;
  numberOfTeams: number;
  playersPerTeam: number;
  teamBudget: number;
  minimumBid: number;
  enableUnsoldPlayerReturn: boolean;
  enableTimer: boolean;
  timerDuration: number;
}

interface TournamentSetupProps {
  onNext: () => void;
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({ onNext }) => {
  const { createTournament } = useAuctionStore();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TournamentFormData>({
    defaultValues: {
      name: 'IPL Auction 2025',
      numberOfTeams: 4,
      playersPerTeam: 7,
      teamBudget: 1000, // ₹1000 for quick testing
      minimumBid: 100, // ₹100 minimum bid
      enableUnsoldPlayerReturn: true,
      enableTimer: true,
      timerDuration: 30,
    },
  });

  const watchedBudget = watch('teamBudget');
  const watchedPlayersPerTeam = watch('playersPerTeam');

  // Function to calculate appropriate minimum bid based on budget
  const calculateMinimumBid = (budget: number, playersPerTeam?: number): number => {
    const players = playersPerTeam || watchedPlayersPerTeam || 7;
    const tenPercentBid = Math.round(budget * 0.1);

    // Ensure the calculated bid doesn't exceed the maximum reasonable amount
    const maxReasonableMinBid = Math.floor(budget / players);

    // Return the smaller of 10% or the maximum reasonable amount
    return Math.min(tenPercentBid, maxReasonableMinBid);
  };

  // Function to validate minimum bid based on budget and players per team
  const validateMinimumBid = (minimumBid: number): string | boolean => {
    const budget = watchedBudget || 0;
    const playersPerTeam = watchedPlayersPerTeam || 7;

    if (!budget || !playersPerTeam) return true;

    // Calculate maximum reasonable minimum bid (budget / players per team)
    // This ensures teams can afford at least one player per slot at minimum bid
    const maxReasonableMinBid = Math.floor(budget / playersPerTeam);

    // Calculate minimum reasonable minimum bid (at least 0.1% of average player budget)
    const avgPlayerBudget = budget / playersPerTeam;
    const minReasonableMinBid = Math.max(10, Math.floor(avgPlayerBudget * 0.001));

    if (minimumBid > maxReasonableMinBid) {
      return `Minimum bid too high! Teams won't be able to afford ${playersPerTeam} players. Maximum recommended: ${formatCurrency(maxReasonableMinBid)}`;
    }

    if (minimumBid < minReasonableMinBid) {
      return `Minimum bid too low for this budget. Minimum recommended: ${formatCurrency(minReasonableMinBid)}`;
    }

    return true;
  };

  const onSubmit = (data: TournamentFormData) => {
    createTournament({
      name: data.name,
      numberOfTeams: data.numberOfTeams,
      playersPerTeam: data.playersPerTeam,
      teamBudget: data.teamBudget,
      settings: {
        enableUnsoldPlayerReturn: data.enableUnsoldPlayerReturn,
        unsoldPlayerReturnRound: 1,
        enableTimer: data.enableTimer,
        timerDuration: data.timerDuration,
        minimumBid: data.minimumBid,
      },
    });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tournament Configuration
          </h2>
          <p className="text-gray-600">
            Set up your IPL-style auction tournament with teams and budget details.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tournament Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Name
            </label>
            <input
              type="text"
              id="name"
              {...register('name', {
                required: 'Tournament name is required',
                minLength: {
                  value: 3,
                  message: 'Tournament name must be at least 3 characters',
                },
              })}
              className="input-field"
              placeholder="Enter tournament name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Number of Teams */}
          <div>
            <label htmlFor="numberOfTeams" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Teams
            </label>
            <select
              id="numberOfTeams"
              {...register('numberOfTeams', {
                required: 'Number of teams is required',
                min: { value: 2, message: 'Minimum 2 teams required' },
                max: { value: 16, message: 'Maximum 16 teams allowed' },
              })}
              className="input-field"
            >
              {[2, 4, 6, 8, 10, 12, 14, 16].map((num) => (
                <option key={num} value={num}>
                  {num} Teams
                </option>
              ))}
            </select>
            {errors.numberOfTeams && (
              <p className="mt-1 text-sm text-red-600">{errors.numberOfTeams.message}</p>
            )}
          </div>

          {/* Players per Team */}
          <div>
            <label htmlFor="playersPerTeam" className="block text-sm font-medium text-gray-700 mb-2">
              Players per Team
            </label>
            <input
              type="number"
              id="playersPerTeam"
              {...register('playersPerTeam', {
                required: 'Players per team is required',
                min: { value: 5, message: 'Minimum 5 players per team' },
                max: { value: 25, message: 'Maximum 25 players per team' },
              })}
              className="input-field"
              placeholder="Enter players per team"
            />
            {errors.playersPerTeam && (
              <p className="mt-1 text-sm text-red-600">{errors.playersPerTeam.message}</p>
            )}
          </div>

          {/* Team Budget */}
          <div>
            <label htmlFor="teamBudget" className="block text-sm font-medium text-gray-700 mb-2">
              Team Budget
            </label>
            <div className="relative">
              <input
                type="number"
                id="teamBudget"
                {...register('teamBudget', {
                  required: 'Team budget is required',
                  min: { value: 100, message: 'Minimum budget is ₹100' },
                  max: { value: 10000000000, message: 'Maximum budget is ₹1000 Crores' },
                })}
                className="input-field pr-24"
                placeholder="Enter team budget"
                step="100"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">
                  {formatCurrency(watchedBudget || 0)}
                </span>
              </div>
            </div>
            {errors.teamBudget && (
              <p className="mt-1 text-sm text-red-600">{errors.teamBudget.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Minimum: ₹100 • Recommended: ₹100 Crores for full IPL experience
            </p>
          </div>

          {/* Quick Budget Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Budget Options
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select a budget preset. Minimum bid will be automatically calculated.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: '₹1000', value: 1000 },
                { label: '₹10 L', value: 1000000 },
                { label: '₹1 Cr', value: 10000000 },
                { label: '₹10 Cr', value: 100000000 },
                { label: '₹50 Cr', value: 500000000 },
                { label: '₹100 Cr', value: 1000000000 },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    const suggestedMinBid = calculateMinimumBid(option.value, watchedPlayersPerTeam);
                    setValue('teamBudget', option.value, { shouldDirty: true });
                    setValue('minimumBid', suggestedMinBid, { shouldDirty: true });
                  }}
                  className="btn-secondary text-sm py-1"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Bid */}
          <div>
            <label htmlFor="minimumBid" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Bid Amount
            </label>
            <div className="relative">
              <input
                type="number"
                id="minimumBid"
                {...register('minimumBid', {
                  required: 'Minimum bid is required',
                  min: { value: 10, message: 'Minimum bid must be at least ₹10' },
                  max: { value: 200000000, message: 'Maximum minimum bid is ₹20 Crores' },
                  validate: validateMinimumBid,
                })}
                className="input-field pr-24"
                placeholder="Enter minimum bid"
                step="10"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">
                  {formatCurrency(watch('minimumBid') || 0)}
                </span>
              </div>
            </div>
            {errors.minimumBid && (
              <p className="mt-1 text-sm text-red-600">{errors.minimumBid.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Starting price for players without base price • Auto-calculated when using quick budget options
            </p>
            {watchedBudget && watchedPlayersPerTeam && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-800">
                  <strong>Recommended range:</strong> {formatCurrency(Math.max(10, Math.floor((watchedBudget / watchedPlayersPerTeam) * 0.001)))} - {formatCurrency(Math.floor(watchedBudget / watchedPlayersPerTeam))}
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Based on {watchedPlayersPerTeam} players per team and {formatCurrency(watchedBudget)} budget
                </p>
              </div>
            )}
          </div>

          {/* Unsold Players Setting */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableUnsoldPlayerReturn"
                {...register('enableUnsoldPlayerReturn')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enableUnsoldPlayerReturn" className="ml-2 block text-sm text-gray-900">
                Enable unsold player return
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Unsold players will be brought back for auction after all players have been auctioned once
            </p>
          </div>

          {/* Timer Settings */}
          <div>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="enableTimer"
                {...register('enableTimer')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enableTimer" className="ml-2 block text-sm text-gray-900">
                Enable auction timer
              </label>
            </div>
            <p className="mb-3 text-sm text-gray-500">
              Automatically advance auction after specified time if no bids are placed
            </p>

            {watch('enableTimer') && (
              <div>
                <label htmlFor="timerDuration" className="block text-sm font-medium text-gray-700 mb-2">
                  Timer Duration
                </label>
                <select
                  id="timerDuration"
                  {...register('timerDuration', {
                    required: watch('enableTimer') ? 'Timer duration is required when timer is enabled' : false,
                  })}
                  className="input-field"
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>120 seconds</option>
                </select>
                {errors.timerDuration && (
                  <p className="mt-1 text-sm text-red-600">{errors.timerDuration.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary">
              Next: Upload Players
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          💡 Tournament Setup Tips
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Default format: 4 teams with 7 players each (customizable)</li>
          <li>• Typical budget: ₹100 Crores per team</li>
          <li>• Timer: Enable for automatic auction progression</li>
          <li>• You can customize team names in the next step</li>
          <li>• All teams will have equal budgets and player limits</li>
        </ul>
      </div>
    </div>
  );
};

export default TournamentSetup;
