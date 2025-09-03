'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { TileData } from './CSVTable';
import { AIPatternFunctions } from './AIPatternFunctions';

interface GridCell {
  x: number;
  y: number;
  tile?: TileData;
  rotation?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
  }>;
}

interface AIPatternChatPopupProps {
  grid: GridCell[];
  allTiles: TileData[];
  onGridUpdate: (newGrid: GridCell[]) => void;
  gridWidth?: number;
  gridHeight?: number;
}

export default function AIPatternChatPopup({ 
  grid, 
  allTiles, 
  onGridUpdate,
  gridWidth = 12,
  gridHeight = 8 
}: AIPatternChatPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const patternFunctionsRef = useRef<AIPatternFunctions | null>(null);

  // Initialize welcome message on client side to avoid hydration mismatch
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hey! I can help arrange your tiles. Try asking:
• "Fill the grid"
• "Match the edges"
• "Find mirrors" 
• "Show rotations"

What pattern should we make?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Initialize pattern functions
  useEffect(() => {
    patternFunctionsRef.current = new AIPatternFunctions(
      grid,
      allTiles,
      onGridUpdate,
      gridWidth,
      gridHeight
    );
  }, []);

  // Update pattern functions when grid changes
  useEffect(() => {
    if (patternFunctionsRef.current) {
      patternFunctionsRef.current.updateGrid(grid);
    }
  }, [grid]);

  // Test Claude API connection on load
  useEffect(() => {
    testConnection();
  }, []);

  // Auto-scroll to bottom when chat is open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const testConnection = async () => {
    try {
      console.log('🔍 Testing API endpoints...');
      
      // Test basic endpoint first
      const testResponse = await fetch('/api/test');
      const testData = await testResponse.json();
      console.log('✅ Test endpoint:', testResponse.status, testData);
      
      // Test ai-chat endpoint
      const aiResponse = await fetch('/api/ai-chat');
      console.log('🤖 AI Chat endpoint status:', aiResponse.status);
      
      // Test simple endpoint
      const simpleResponse = await fetch('/api/ai-chat-simple');
      const simpleData = await simpleResponse.json();
      console.log('🧪 Simple endpoint:', simpleResponse.status, simpleData);
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        console.log('✅ AI Chat endpoint:', aiData);
        setApiStatus(aiData.success ? 'connected' : 'error');
      } else {
        console.log('❌ AI Chat endpoint failed:', aiResponse.status);
        setApiStatus('error');
      }
    } catch (error) {
      console.log('❌ Connection test failed:', error);
      setApiStatus('error');
    }
  };

  const executeFunction = async (functionName: string, args: any = {}) => {
    if (!patternFunctionsRef.current) return null;

    try {
      const result = await patternFunctionsRef.current.executeFunction(functionName, args);
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Error executing ${functionName}: ${error}`
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get available functions
      const availableFunctions = patternFunctionsRef.current?.getAvailableFunctions() || [];

      // Send to Claude API with retry mechanism for route registration issues
      let response, data;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 API attempt ${attempts}/${maxAttempts}`);
        
        try {
          response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
              availableFunctions
            }),
          });

          if (response.ok) {
            data = await response.json();
            console.log('✅ API request successful on attempt', attempts);
            break;
          } else if (response.status === 404 && attempts < maxAttempts) {
            console.log(`⚠️ 404 on attempt ${attempts}, retrying in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            data = await response.json();
            break;
          }
        } catch (fetchError) {
          if (attempts < maxAttempts) {
            console.log(`⚠️ Fetch error on attempt ${attempts}:`, fetchError);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            throw fetchError;
          }
        }
      }

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      // Execute any function calls
      let functionResults: any[] = [];
      console.log('🔍 Checking function calls:', data.functionCalls);
      
      if (data.functionCalls && data.functionCalls.length > 0) {
        console.log('🎯 Found', data.functionCalls.length, 'function calls to execute');
        
        for (const funcCall of data.functionCalls) {
          console.log('⚡ Executing function:', funcCall.name, 'with args:', funcCall.arguments);
          
          const result = await executeFunction(funcCall.name, funcCall.arguments);
          console.log('✅ Function result:', result);
          
          functionResults.push({
            ...funcCall,
            result
          });
        }
        
        console.log('🚀 All functions executed, results:', functionResults);
      } else {
        console.log('❌ No function calls found in AI response');
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        functionCalls: functionResults.length > 0 ? functionResults : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      let errorExplanation = '';
      
      if (error.toString().includes('404')) {
        errorExplanation = `
🔍 **API Route Debug Info:**
- The /api/ai-chat endpoint returns 404 
- This happens when Next.js hasn't registered the route
- **Solution**: Restart the dev server to register new API routes
- Check console for endpoint test results
- Alternative: Try using a different terminal session`;
      } else if (error.toString().includes('401')) {
        errorExplanation = `
🔑 **API Key Issue:**
- ANTHROPIC_API_KEY may be invalid or expired
- Check your .env.local file
- Get a new key from https://console.anthropic.com/`;
      } else {
        errorExplanation = `
⚠️ **Network/Server Issue:**
- Check if the dev server is running
- Look at console for detailed error logs
- Try refreshing the page`;
      }

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error}${errorExplanation}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 text-2xl"
        title="Open Pattern Chat"
      >
        💬
      </button>

      {/* Chat Modal - Hovering over grid */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute bottom-20 right-6 w-96 h-[500px] bg-gray-900 text-white rounded-lg shadow-2xl flex flex-col pointer-events-auto border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-800 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-white">Pattern Chat</h3>
                <div className={`h-2 w-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-green-400' : 
                  apiStatus === 'error' ? 'bg-red-400' : 
                  'bg-gray-400'
                }`} />
                <span className="text-xs text-gray-400">
                  {grid.filter(cell => cell.tile).length}/{grid.length}
                </span>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-sm prose prose-invert prose-sm max-w-none prose-p:mb-2 prose-p:mt-0">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm break-words">{message.content}</div>
                    )}
                    
                    {/* Function Call Results */}
                    {message.functionCalls && message.functionCalls.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.functionCalls.map((funcCall, idx) => (
                          <div key={idx} className="bg-white bg-opacity-20 rounded p-2 text-xs">
                            <div className="font-semibold">🔧 {funcCall.name}</div>
                            {funcCall.result && (
                              <div className={`mt-1 ${funcCall.result.success ? 'text-green-200' : 'text-red-200'}`}>
                                {funcCall.result.message}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-lg px-4 py-3 text-gray-200 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-600 p-4">
              <div className="flex space-x-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about patterns..."
                  className="flex-1 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>Powered by Claude</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}