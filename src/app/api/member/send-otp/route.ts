import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMemberOtp } from "@/lib/email";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Security check: If the email belongs to a GLOBAL_ADMIN, block OTP and force PCO login.
    const adminUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        role: "GLOBAL_ADMIN"
      }
    });

    if (adminUser) {
      return NextResponse.json({ 
        error: "Administrator accounts must sign in via Planning Center." 
      }, { status: 403 });
    }

    const pcPatId = process.env.PLANNING_CENTER_PAT_ID || process.env.PLANNING_CENTER_CLIENT_ID;
    const pcPatSecret = process.env.PLANNING_CENTER_PAT_SECRET || process.env.PLANNING_CENTER_CLIENT_SECRET;

    if (!pcPatId || !pcPatSecret) {
      console.error("Missing Planning Center credentials in .env");
      return NextResponse.json({ error: "Internal configuration error" }, { status: 500 });
    }

    const authHeader = 'Basic ' + Buffer.from(`${pcPatId}:${pcPatSecret}`).toString('base64');
    
    const pcResponse = await fetch(`https://api.planningcenteronline.com/people/v2/people?where[emails]=${encodeURIComponent(normalizedEmail)}`, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!pcResponse.ok) {
      const errorText = await pcResponse.text();
      console.error(`PCO API Error (${pcResponse.status}):`, errorText || "No response body");
      
      // If unauthorized, it means the token doesn't have privileges or is the wrong type
      if (pcResponse.status === 401 || pcResponse.status === 403) {
         console.error("Authentication failed against PCO. Ensure you are using a Personal Access Token (PAT) and not an OAuth Client ID for the server search.");
      }
      
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const pcData = await pcResponse.json();
    
    if (!pcData.data || pcData.data.length === 0) {
      // Silently succeed to avoid email enumeration
      return NextResponse.json({ success: true });
    }

    // Extract name from PCO
    const person = pcData.data[0];
    const attributes = person.attributes || {};
    const name = attributes.name || `${attributes.first_name || ""} ${attributes.last_name || ""}`.trim() || null;

    // Delete old OTPs for this email
    await prisma.memberOtp.deleteMany({ where: { email: normalizedEmail } });

    // Generate and store new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.memberOtp.create({
      data: { email: normalizedEmail, name, code, expiresAt },
    });

    await sendMemberOtp(normalizedEmail, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "Failed to send code. Please try again." }, { status: 500 });
  }
}
