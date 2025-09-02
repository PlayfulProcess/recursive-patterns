import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface FunctionCall {
  name: string;
  arguments: any;
}

interface ChatResponse {
  message: string;
  functionCalls?: FunctionCall[];
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { messages, availableFunctions } = await request.json();
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'Claude API key not configured. Please set ANTHROPIC_API_KEY environment variable.'
      }, { status: 401 });
    }

    // Prepare system message about available pattern functions
    const systemPrompt = `You are an AI assistant that helps users create beautiful tile patterns. You have access to sophisticated edge matching algorithms that can:

Available Pattern Functions:
${availableFunctions?.map((f: any) => `- ${f.name}: ${f.description}`).join('\n') || ''}

You can call these functions by responding with function calls in your message. When users ask about patterns, tiles, or want to create beautiful arrangements, use these functions.

The grid contains tiles with edge colors that can be matched using two-segment edge signatures. You can:
1. Optimize initial tile placement
2. Build horizontal chains (lateral edges)  
3. Build vertical chains (bottom edges)
4. Create complete beautiful patterns
5. Debug edge signatures

Always explain what you're doing and why a particular function would help create better patterns.`;

    // Prepare Claude API request
    const claudeMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: systemPrompt },
          ...claudeMessages
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Claude API error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    let messageContent = data.content?.[0]?.text || 'No response from Claude';

    // Parse potential function calls from Claude's response
    const functionCalls: FunctionCall[] = [];
    
    // Look for function call patterns in Claude's response
    const functionCallPattern = /CALL_FUNCTION:\s*(\w+)(?:\s*with\s*(.+?))?(?=\n|$)/gi;
    let match;
    
    while ((match = functionCallPattern.exec(messageContent)) !== null) {
      const functionName = match[1];
      const argsText = match[2];
      let args = {};
      
      if (argsText) {
        try {
          args = JSON.parse(argsText);
        } catch (e) {
          // If not valid JSON, treat as simple string argument
          args = { argument: argsText.trim() };
        }
      }
      
      functionCalls.push({
        name: functionName,
        arguments: args
      });
    }

    // Clean up the message by removing function call syntax
    messageContent = messageContent.replace(functionCallPattern, '').trim();

    const chatResponse: ChatResponse = {
      success: true,
      message: messageContent,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined
    };

    return NextResponse.json(chatResponse);

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Sorry, I encountered an error processing your request.'
    }, { status: 500 });
  }
}

// Test endpoint
export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    return NextResponse.json({
      success: false,
      message: 'Claude API key not configured'
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 50,
        messages: [
          { role: 'user', content: 'Say hello briefly' }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: data.content?.[0]?.text || 'Claude API connected!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Claude API error: ${response.status}`
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Claude API'
    });
  }
}