import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('🚀 POST endpoint called!');
  return NextResponse.json({ 
    success: true, 
    message: 'Simple POST endpoint working!',
    timestamp: new Date().toISOString()
  });
}

export async function GET(req: Request) {
  console.log('🚀 GET endpoint called!');
  return NextResponse.json({ 
    success: true, 
    message: 'Simple GET endpoint working!',
    timestamp: new Date().toISOString()
  });
}