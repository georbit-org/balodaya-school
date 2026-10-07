import { NextResponse } from 'next/server';

export interface InquiryItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  createdAt: string;
}

// Global in-memory storage for development and staff portal retrieval
export const globalInquiries: InquiryItem[] = [
  {
    id: 'inq-101',
    name: 'Bimal Thapa',
    phone: '9846123456',
    email: 'bimal.thapa@gmail.com',
    subject: 'Grade 7 Admission query',
    message: 'Hello, what are the bus routes reaching Waling and Sundar Bazar for morning pickup?',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inq-102',
    name: 'Radha Adhikari',
    phone: '9856098765',
    email: 'radha.a@gmail.com',
    subject: 'Montessori Kindergarten timing',
    message: 'We are moving to Bheerkot-06 next month and would like to register our 4-year-old in LKG.',
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  return NextResponse.json({ inquiries: globalInquiries });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name || !data.phone || !data.message) {
      return NextResponse.json(
        { error: 'Name, phone, and message are required fields.' },
        { status: 400 }
      );
    }

    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      name: String(data.name).trim(),
      phone: String(data.phone).trim(),
      email: data.email ? String(data.email).trim() : undefined,
      subject: data.subject ? String(data.subject).trim() : 'General Inquiry',
      message: String(data.message).trim(),
      createdAt: new Date().toISOString()
    };

    globalInquiries.unshift(newInquiry);

    return NextResponse.json({
      success: true,
      message: 'Inquiry successfully submitted to Balodaya administration.',
      inquiry: newInquiry
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Internal server error processing inquiry.' },
      { status: 500 }
    );
  }
}
