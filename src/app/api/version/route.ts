import { NextResponse } from "next/server";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";

export async function GET() {
  try {
    const res = await fetchWithLoadBalancer("/version");
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, detail: "All backend servers are unreachable." },
      { status: 503 }
    );
  }
}
