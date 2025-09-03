import { NextRequest, NextResponse } from 'next/server';

// Minimal POST handler to test if POST methods work at all
export async function POST(request: NextRequest) {
  console.log('[simple-post] POST request received');
  
  try {
    const body = await request.json();
    console.log('[simple-post] Body:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'POST worked!',
      received: body 
    });
  } catch (error) {
    console.error('[simple-post] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process POST' 
    }, { status: 500 });
  }
}

// Also add GET for comparison
export async function GET() {
  console.log('[simple-post] GET request received');
  return NextResponse.json({ 
    success: true, 
    message: 'GET worked!' 
  });
}