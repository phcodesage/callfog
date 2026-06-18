import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isLocal: boolean;
}

interface ChatProps {
  onSendMessage: (message: string) => void;
  messages: Message[];
  onTyping: (isTyping: boolean) => void;
  remoteTyping: boolean;
  remoteName: string;
  onClearChat: () => void;
  isOpen: boolean;
}

export function Chat({
  onSendMessage,
  messages,
  onTyping,
  remoteTyping,
  remoteName,
  onClearChat,
  isOpen
}: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (e.target.value.length > 0) {
      onTyping(true);

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else {
      onTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      onTyping(false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      onClearChat();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full glass rounded-[2.5rem] flex flex-col border-white/5 shadow-2xl overflow-hidden ml-4">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/40">
        <h3 className="text-white font-bold flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          Room Chat
        </h3>
        <button
          onClick={handleClearChat}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          title="Clear all messages"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
              <MessageSquare className="w-10 h-10 text-slate-600" />
            </div>
            <p className="font-medium text-slate-400">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isLocal ? 'justify-end' : 'justify-start'} animate-slide-in`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                  message.isLocal
                    ? 'bg-indigo-600/90 text-white rounded-tr-sm backdrop-blur-md border border-indigo-500/30'
                    : 'glass-panel text-slate-200 rounded-tl-sm'
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${message.isLocal ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {message.isLocal ? 'You' : message.sender}
                </div>
                <div className="break-words leading-relaxed text-sm">{message.text}</div>
                <div className={`text-[10px] mt-2 text-right ${message.isLocal ? 'text-indigo-300' : 'text-slate-500'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {remoteTyping && (
          <div className="flex justify-start animate-slide-in">
            <div className="glass-panel text-slate-400 rounded-2xl rounded-tl-sm p-4 text-sm flex items-center gap-2">
              <span className="italic">{remoteName} is typing</span>
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-slate-900/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-slate-950/50 border border-white/10 text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder-slate-500 transition-all text-sm"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="glass-button bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
