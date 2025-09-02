import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read the CSV file from public directory
    const filePath = path.join(process.cwd(), 'public', 'patterns2.csv');
    const csvData = await fs.readFile(filePath, 'utf8');
    
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return NextResponse.json(
      { error: 'CSV file not found' },
      { status: 404 }
    );
  }
}