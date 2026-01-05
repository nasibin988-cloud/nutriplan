'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMealPlan, setHasMealPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      if (isInitialized) return;
      setIsLoading(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', sessionId }),
        });
        const data = await response.json();
        if (data.message) {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          }]);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to start conversation:', error);
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Welcome to NutriPlan. I\'m here to help you create a personalized nutrition plan. What\'s your main health or nutrition goal?',
          timestamp: new Date(),
        }]);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };
    initConversation();
  }, [sessionId, isInitialized]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          sessionId,
          message: messageText.trim(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.message) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }]);
      }

      // Check if a meal plan was generated
      if (data.mealPlan) {
        sessionStorage.setItem('mealPlan', JSON.stringify(data.mealPlan));
        setHasMealPlan(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [sessionId, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetConversation = async () => {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', sessionId }),
      });
      setMessages([]);
      setIsInitialized(false);
      setHasMealPlan(false);
      sessionStorage.removeItem('mealPlan');
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  };

  const viewMealPlan = () => {
    router.push('/plan');
  };

  // Format inline text with bold/italic
  const formatInlineText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Find bold text **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        // Add text before bold
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        // Add bold text
        parts.push(<span key={key++} className="font-semibold text-white">{boldMatch[1]}</span>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        // No more bold, add remaining text
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }
    return parts;
  };

  // Format message content with markdown-like styling
  const formatContent = (content: string) => {
    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((para, idx) => {
      // Check for numbered lists (1. 2. 3. etc)
      if (/^\d+\.\s/.test(para) || para.includes('\n1.') || para.includes('\n2.')) {
        const lines = para.split('\n');
        return (
          <ol key={idx} className="mt-2 space-y-1 list-none">
            {lines.map((line, i) => {
              const numMatch = line.match(/^(\d+)\.\s*(.*)$/);
              if (numMatch) {
                return (
                  <li key={i} className="flex items-start">
                    <span className="text-indigo-400 mr-2 min-w-[1.5rem]">{numMatch[1]}.</span>
                    <span>{formatInlineText(numMatch[2])}</span>
                  </li>
                );
              }
              return <span key={i}>{formatInlineText(line)}</span>;
            })}
          </ol>
        );
      }

      // Check for bullet points (- or *)
      const hasBullets = para.includes('\n-') || para.startsWith('-') ||
                         para.includes('\n*') || para.includes(' * ') ||
                         (para.startsWith('*') && !para.startsWith('**'));
      if (hasBullets) {
        // Split by newline or " * " pattern (for inline bullets)
        const lines = para.includes(' * ')
          ? para.split(/\s\*\s/).map((l, i) => i === 0 ? l : '* ' + l)
          : para.split('\n');
        return (
          <ul key={idx} className="mt-2 space-y-1">
            {lines.map((line, i) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.startsWith('**'))) {
                const content = trimmed.startsWith('-') ? trimmed.substring(1).trim() : trimmed.substring(1).trim();
                return (
                  <li key={i} className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>{formatInlineText(content)}</span>
                  </li>
                );
              }
              if (trimmed) {
                return <div key={i} className="font-medium text-white mt-2">{formatInlineText(trimmed)}</div>;
              }
              return null;
            })}
          </ul>
        );
      }

      // Check for standalone headers (entire line is bold)
      if (para.startsWith('**') && para.endsWith('**') && para.split('**').length === 3) {
        return (
          <h3 key={idx} className="text-lg font-semibold text-white mt-4 mb-2">
            {para.replace(/\*\*/g, '')}
          </h3>
        );
      }

      // Check for italics (single asterisk, not double)
      if (para.startsWith('*') && !para.startsWith('**') && para.endsWith('*')) {
        return (
          <p key={idx} className="text-indigo-300 italic mt-2">
            {para.slice(1, -1)}
          </p>
        );
      }

      // Regular paragraph with possible inline formatting
      return <p key={idx} className="mt-2">{formatInlineText(para)}</p>;
    });
  };

  return (
    <div className="min-h-screen gradient-bg grid-pattern flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">NutriPlan</h1>
                <p className="text-xs text-zinc-500">AI Nutrition Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {hasMealPlan && (
                <button
                  onClick={viewMealPlan}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-all text-sm text-white font-medium animate-fadeIn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>View Your Plan</span>
                </button>
              )}
              <button
                onClick={resetConversation}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all text-sm text-zinc-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>New Chat</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                      : 'glass text-zinc-200 rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-sm leading-relaxed space-y-1">
                      {formatContent(message.content)}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="glass rounded-2xl rounded-bl-md px-5 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-zinc-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-800/50 bg-[#0a0a0f]/80 backdrop-blur-xl p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-4">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-5 py-4 bg-zinc-900/80 border border-zinc-700/50 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-sm"
                    style={{ minHeight: '56px', maxHeight: '200px' }}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-3 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
