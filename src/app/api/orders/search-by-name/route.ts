import { NextRequest, NextResponse } from 'next/server';
import { searchOrdersByCustomerName } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const storeCode = searchParams.get('storeCode');
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Both firstName and lastName are required' },
        { status: 400 }
      );
    }

    // Basic validation - names should be at least 2 characters
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Names must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Limit days back to prevent overly broad searches
    const safeDaysBack = Math.min(Math.max(daysBack, 7), 90);

    const orders = await searchOrdersByCustomerName(
      firstName,
      lastName,
      storeCode || undefined,
      safeDaysBack
    );

    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        storeCode: storeCode || null,
        daysBack: safeDaysBack,
        matchCount: orders.length,
      },
    });
  } catch (error) {
    console.error('Failed to search orders by customer name:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search orders' },
      { status: 500 }
    );
  }
}
