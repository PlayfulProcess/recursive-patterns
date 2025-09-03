'use client';

import { useState, useRef, useEffect } from 'react';
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

interface AIPatternChatProps {
  grid: GridCell[];
  allTiles: TileData[];
  onGridUpdate: (newGrid: GridCell[]) => void;
  gridWidth?: number;
  gridHeight?: number;
}

export default function AIPatternChat({ 
  grid, 
  allTiles, 
  onGridUpdate,
  gridWidth = 12,
  gridHeight = 8 
}: AIPatternChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize welcome message on client side to avoid hydration mismatch
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `🎨 **AI Pattern Assistant ready!** 

I can help you create beautiful tile patterns using advanced edge matching algorithms. I can:

• **Optimize Edge Matching** - Smart initial tile placement
• **Build Lateral Chains** - Create horizontal flow patterns  
• **Build Vertical Chains** - Create vertical flow patterns
• **Complete Beautiful Patterns** - Run the full algorithm
• **Debug Edge Signatures** - Analyze tile connections

Try asking me things like:
- "Create a beautiful pattern"
- "Build horizontal chains"  
- "Optimize the edge matching"
- "Show me the edge signatures"
- "Analyze the current grid"

What would you like to do with your tiles?`,
        timestamp: new Date()
      }]);
    }
  }, []);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const patternFunctionsRef = useRef<AIPatternFunctions | null>(null);

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const testConnection = async () => {
    try {
      const response = await fetch('/api/ai-chat');
      const data = await response.json();
      setApiStatus(data.success ? 'connected' : 'error');
    } catch (error) {
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

      // Send to Claude API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          availableFunctions
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      // Execute any function calls
      let functionResults: any[] = [];
      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const funcCall of data.functionCalls) {
          const result = await executeFunction(funcCall.name, funcCall.arguments);
          functionResults.push({
            ...funcCall,
            result
          });
        }
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
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error}. 

${apiStatus === 'error' ? 'Make sure your ANTHROPIC_API_KEY is set correctly.' : ''}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            🤖
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI Pattern Assistant</h3>
            <p className="text-xs text-gray-500">
              {apiStatus === 'connected' ? '✅ Claude API Connected' : 
               apiStatus === 'error' ? '❌ API Error' : '🔄 Checking...'}
            </p>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {grid.filter(cell => cell.tile).length} tiles loaded
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              
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
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create patterns, optimize tiles, or analyze the grid..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
}