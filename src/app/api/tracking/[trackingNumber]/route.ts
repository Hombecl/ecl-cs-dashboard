import { NextRequest, NextResponse } from 'next/server';
import { trackPackage } from '@/lib/tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  const { trackingNumber } = await params;
  const apiKey = process.env.TRACK17_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: '17Track API key not configured',
        message: 'Please add TRACK17_API_KEY to your environment variables',
      },
      { status: 503 }
    );
  }

  if (!trackingNumber) {
    return NextResponse.json(
      { success: false, error: 'Tracking number is required' },
      { status: 400 }
    );
  }

  try {
    const trackingInfo = await trackPackage(trackingNumber, apiKey);

    if (!trackingInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tracking information not found',
          trackingNumber,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trackingInfo,
    });
  } catch (error) {
    console.error('Tracking API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (errorMessage.includes('Invalid 17Track API key')) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('Rate limit')) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
