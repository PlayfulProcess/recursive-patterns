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
    const systemPrompt = `You help create beautiful tile patterns. Be conversational and brief.

**Available Functions:**
${availableFunctions.map((f: any) => `- ${f.name}: ${f.description}`).join('\n')}

**Key Capabilities:**
- **Recursive Optimization**: optimizeMirrorPlacement and balanceColorDistribution work like optimizeEdgeMatching - they iterate to improve patterns
- **Pattern Analysis**: analyzePatternQuality gives detailed scores and recommendations
- **Function Chaining**: You can combine multiple operations (e.g., "fill grid, optimize mirrors, then balance colors")

**Grid System:** Positions are 0-95 (0=top-left, 11=top-right, 84=bottom-left, 95=bottom-right)

**Function Call Format:** CALL_FUNCTION: functionName with {"param": "value"}

**Examples:**
- Mirror optimization: {"direction": "both", "iterations": 5}  
- Color balance: {"targetBalance": "even"}
- Analysis: {} (no parameters needed)

Be helpful and explain what each function does for the user.`;

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