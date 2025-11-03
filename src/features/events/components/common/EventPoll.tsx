import React, { useState, useEffect } from 'react';
import { interactiveEventService } from '@features/events/services/interactiveEventService';
import { Poll, PollOption } from '@features/events/types/social.types';

interface EventPollProps {
  eventId: string;
  currentUserId: string;
  currentUserName: string;
  canCreatePolls?: boolean;
  className?: string;
}

export const EventPoll: React.FC<EventPollProps> = ({
  eventId,
  currentUserId,
  currentUserName,
  canCreatePolls = false,
  className = ''
}) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolls();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(loadPolls, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadPolls = async () => {
    try {
      const eventPolls = await interactiveEventService.getEventPolls(eventId);
      setPolls(eventPolls);
    } catch (error) {
      console.error('Failed to load polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      await interactiveEventService.votePoll(pollId, currentUserId, optionIds);
      await loadPolls(); // Refresh to show updated results
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await interactiveEventService.closePoll(pollId, currentUserId);
      await loadPolls();
    } catch (error) {
      console.error('Failed to close poll:', error);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📊</span>
          Event Polls
        </h3>
        {canCreatePolls && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
          >
            Create Poll
          </button>
        )}
      </div>

      {/* Create poll form */}
      {showCreateForm && (
        <CreatePollForm
          eventId={eventId}
          createdBy={currentUserId}
          onPollCreated={() => {
            setShowCreateForm(false);
            loadPolls();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Polls list */}
      {polls.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No polls yet</p>
          {canCreatePolls && (
            <p className="text-sm mt-1">Create the first poll to engage participants!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={currentUserId}
              onVote={handleVote}
              onClose={handleClosePoll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CreatePollFormProps {
  eventId: string;
  createdBy: string;
  onPollCreated: () => void;
  onCancel: () => void;
}

const CreatePollForm: React.FC<CreatePollFormProps> = ({
  eventId,
  createdBy,
  onPollCreated,
  onCancel
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [creating, setCreating] = useState(false);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    if (!question.trim()) {
      alert('Please provide a question');
      return;
    }

    setCreating(true);
    try {
      await interactiveEventService.createPoll(
        eventId,
        createdBy,
        question.trim(),
        validOptions,
        allowMultiple,
        isAnonymous,
        duration
      );
      onPollCreated();
    } catch (error) {
      console.error('Failed to create poll:', error);
      alert('Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Poll</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask?"
            className="w-full p-3 border border-gray-300 rounded-lg"
            maxLength={200}
            required
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add option
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Allow multiple selections</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Anonymous voting</span>
          </label>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Duration (optional)
            </label>
            <select
              value={duration || ''}
              onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option value="">No time limit</option>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg"
          >
            {creating ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface PollCardProps {
  poll: Poll;
  currentUserId: string;
  onVote: (pollId: string, optionIds: string[]) => void;
  onClose: (pollId: string) => void;
}

const PollCard: React.FC<PollCardProps> = ({
  poll,
  currentUserId,
  onVote,
  onClose
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    // Check if user has already voted (simplified check)
    const userHasVoted = poll.options.some(option => 
      !poll.isAnonymous && option.voterIds.includes(currentUserId)
    );
    setHasVoted(userHasVoted);
  }, [poll, currentUserId]);

  const handleOptionSelect = (optionId: string) => {
    if (hasVoted || !poll.isActive) return;

    if (poll.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote(poll.id, selectedOptions);
      setHasVoted(true);
    }
  };

  const isExpired = poll.endsAt && new Date() > poll.endsAt.toDate();
  const canVote = poll.isActive && !hasVoted && !isExpired;
  const canClose = poll.createdBy === currentUserId && poll.isActive;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {poll.question}
          </h4>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
            {poll.isAnonymous && <span>Anonymous</span>}
            {poll.allowMultiple && <span>Multiple choice</span>}
            {isExpired && <span className="text-red-500">Expired</span>}
            {!poll.isActive && <span className="text-red-500">Closed</span>}
          </div>
        </div>
        {canClose && (
          <button
            onClick={() => onClose(poll.id)}
            className="text-gray-400 hover:text-gray-600"
            title="Close poll"
          >
            ×
          </button>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {poll.options.map(option => (
          <PollOptionCard
            key={option.id}
            option={option}
            isSelected={selectedOptions.includes(option.id)}
            canSelect={canVote}
            showResults={hasVoted || !poll.isActive || isExpired}
            onSelect={() => handleOptionSelect(option.id)}
          />
        ))}
      </div>

      {/* Vote button */}
      {canVote && selectedOptions.length > 0 && (
        <button
          onClick={handleVote}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Vote
        </button>
      )}

      {/* Timer */}
      {poll.endsAt && poll.isActive && !isExpired && (
        <div className="mt-2 text-sm text-gray-500 text-center">
          Ends at {poll.endsAt.toDate().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

interface PollOptionCardProps {
  option: PollOption;
  isSelected: boolean;
  canSelect: boolean;
  showResults: boolean;
  onSelect: () => void;
}

const PollOptionCard: React.FC<PollOptionCardProps> = ({
  option,
  isSelected,
  canSelect,
  showResults,
  onSelect
}) => {
  return (
    <div
      className={`
        relative p-3 border rounded-lg cursor-pointer transition-colors
        ${canSelect ? 'hover:bg-gray-50' : ''}
        ${isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}
        ${!canSelect ? 'cursor-default' : ''}
      `}
      onClick={canSelect ? onSelect : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-900">{option.text}</span>
        {showResults && (
          <span className="text-sm font-medium text-gray-600">
            {option.votes} ({option.percentage}%)
          </span>
        )}
      </div>
      
      {showResults && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${option.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};