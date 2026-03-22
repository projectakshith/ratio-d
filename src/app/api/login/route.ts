import { NextRequest, NextResponse } from "next/server";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetchWithLoadBalancer("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: "All backend servers are currently unreachable or timing out." },
      { status: 503 }
    );
  }
}
