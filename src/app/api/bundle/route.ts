import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'bundle API is alive but empty' });
}