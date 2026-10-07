import { NextResponse } from 'next/server';

export const subscribersList: string[] = ['alumni@balodaya.edu.np'];

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.email || !String(data.email).includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    subscribersList.push(String(data.email).toLowerCase());
    return NextResponse.json({ success: true, message: 'Subscribed to school notices' });
  } catch {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
