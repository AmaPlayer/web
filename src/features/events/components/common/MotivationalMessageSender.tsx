import React, { useState, useEffect } from 'react';
import { motivationalMessagingSystem } from '@features/events/services/motivationalMessaging';
import { MotivationalMessage, MessageCategory } from '@features/events/types/social.types';

interface MotivationalMessageSenderProps {
  toUserId: string;
  toUserName: string;
  fromUserId: string;
  fromUserName: string;
  eventId?: string;
  challengeId?: string;
  sport?: string;
  onMessageSent?: (messageId: string) => void;
  className?: string;
}

export const MotivationalMessageSender: React.FC<MotivationalMessageSenderProps> = ({
  toUserId,
  toUserName,
  fromUserId,
  fromUserName,
  eventId,
  challengeId,
  sport,
  onMessageSent,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>(MessageCategory.ENCOURAGEMENT);
  const [templates, setTemplates] = useState<MotivationalMessage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MotivationalMessage | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, selectedCategory, sport]);

  const loadTemplates = async () => {
    try {
      const templateList = await motivationalMessagingSystem.getMessageTemplates(selectedCategory, sport);
      setTemplates(templateList);
      if (templateList.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templateList[0]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTemplate && !customMessage.trim()) return;

    setIsSending(true);
    try {
      let messageId: string;

      if (isCustom && customMessage.trim()) {
        // Send custom message (create temporary template)
        const tempTemplate: MotivationalMessage = {
          id: 'custom_' + Date.now(),
          template: customMessage,
          category: selectedCategory,
          variables: ['userName'],
          usage_count: 0
        };

        const message = await motivationalMessagingSystem.sendMotivationalMessage(
          fromUserId,
          toUserId,
          tempTemplate.id,
          {
            eventId,
            challengeId,
            type: 'support'
          }
        );
        messageId = message.id;
      } else if (selectedTemplate) {
        // Send template message
        const message = await motivationalMessagingSystem.sendMotivationalMessage(
          fromUserId,
          toUserId,
          selectedTemplate.id,
          {
            eventId,
            challengeId,
            type: getCategoryType(selectedCategory)
          }
        );
        messageId = message.id;
      } else {
        return;
      }

      onMessageSent?.(messageId);
      setIsOpen(false);
      setCustomMessage('');
      setIsCustom(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryType = (category: MessageCategory): 'achievement' | 'participation' | 'support' | 'celebration' => {
    switch (category) {
      case MessageCategory.CONGRATULATIONS:
      case MessageCategory.CELEBRATION:
        return 'celebration';
      case MessageCategory.ENCOURAGEMENT:
      case MessageCategory.MOTIVATION:
        return 'participation';
      default:
        return 'support';
    }
  };

  const getCategoryIcon = (category: MessageCategory): string => {
    switch (category) {
      case MessageCategory.ENCOURAGEMENT: return '💪';
      case MessageCategory.CONGRATULATIONS: return '🎉';
      case MessageCategory.MOTIVATION: return '🔥';
      case MessageCategory.SUPPORT: return '🤝';
      case MessageCategory.CELEBRATION: return '🥳';
      default: return '💬';
    }
  };

  const previewMessage = () => {
    if (isCustom) {
      return customMessage.replace('{userName}', toUserName);
    }
    if (selectedTemplate) {
      return selectedTemplate.template
        .replace('{userName}', toUserName)
        .replace('{sport}', sport || 'sport');
    }
    return '';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        title={`Send motivational message to ${toUserName}`}
      >
        <span>💬</span>
        <span className="text-sm font-medium">Encourage</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Message to {toUserName}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Category selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(MessageCategory).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg border text-sm
                        ${selectedCategory === category
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <span>{getCategoryIcon(category)}</span>
                      <span className="capitalize">{category.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template/Custom toggle */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!isCustom}
                    onChange={() => setIsCustom(false)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Use template</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={isCustom}
                    onChange={() => setIsCustom(true)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Write custom</span>
                </label>
              </div>

              {/* Template selection */}
              {!isCustom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Template
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`
                          w-full text-left p-2 rounded-lg border text-sm
                          ${selectedTemplate?.id === template.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }
                        `}
                      >
                        {template.template.substring(0, 80)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom message input */}
              {isCustom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Write your encouraging message... Use {userName} to personalize it."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {customMessage.length}/500 characters
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  {previewMessage() || 'Select a template or write a custom message to see preview'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSending || (!selectedTemplate && !customMessage.trim())}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg"
              >
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};