import { NextRequest, NextResponse } from 'next/server';

// Main POST handler for AI chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages = [], availableFunctions = [] } = body;
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'Claude API key not configured. Please set ANTHROPIC_API_KEY environment variable.',
        message: 'API key not configured'
      }, { status: 401 });
    }

    // System prompt for pattern functions
    const systemPrompt = `You are an AI assistant that helps users create beautiful tile patterns using advanced edge matching algorithms.

Available Pattern Functions:
${availableFunctions.map((f: any) => `- ${f.name}: ${f.description}`).join('\n')}

You can call these functions by responding with function calls. When users ask about patterns, tiles, or want to create beautiful arrangements, use these functions.

The grid contains tiles with edge colors that can be matched using two-segment edge signatures. You can:
1. Optimize initial tile placement
2. Build horizontal chains (lateral edges)  
3. Build vertical chains (bottom edges)
4. Create complete beautiful patterns
5. Debug edge signatures

To call a function, include in your response: CALL_FUNCTION: functionName with {"param": "value"}

Always explain what you're doing and why a particular function would help create better patterns.`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Claude API error: ${claudeResponse.status}`,
        message: 'Failed to get response from Claude'
      }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const messageContent = claudeData.content?.[0]?.text || 'No response from Claude';

    // Parse function calls from response
    const functionCalls: any[] = [];
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
          args = { argument: argsText?.trim() || '' };
        }
      }
      
      functionCalls.push({
        name: functionName,
        arguments: args
      });
    }

    // Clean message
    const cleanMessage = messageContent.replace(functionCallPattern, '').trim();

    return NextResponse.json({
      success: true,
      message: cleanMessage,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined
    });

  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Sorry, I encountered an error processing your request.'
    }, { status: 500 });
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Chat endpoint is ready',
    status: 'ok'
  });
}