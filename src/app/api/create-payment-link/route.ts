
// This file defines an API endpoint for creating a payment link.
// It acts as a secure server-side proxy to the Supabase Edge Function.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // The function name should match your Supabase Edge Function name
    const { data, error } = await supabaseAdmin().functions.invoke('create-order', {
        body,
    });

    if (error) {
        console.error("Supabase Function invocation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create payment session" },
            { status: 500 }
        );
    }
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Create payment link API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
