import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByCustomerEmail } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const orders = await getOrdersByCustomerEmail(email);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}
