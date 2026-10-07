import { NextResponse } from 'next/server';
import { schoolData } from '@/data/schoolData';

let currentSettings = {
  schoolName: schoolData.name,
  schoolNepaliName: schoolData.nepaliName,
  phone: schoolData.contact.phone,
  email: schoolData.contact.email,
  address: `${schoolData.location.address}, ${schoolData.location.district}, Nepal`,
  officeHours: schoolData.contact.hours,
  motto: schoolData.motto,
  mottoNepali: schoolData.mottoNepali,
};

export async function GET() {
  return NextResponse.json(currentSettings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    currentSettings = {
      ...currentSettings,
      ...body,
    };
    return NextResponse.json({ success: true, settings: currentSettings });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
}
