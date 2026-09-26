import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SARVAM_API_KEY is not configured in .env" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages = [], studentContext = null } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Backend endpoints specification for ratio'd
    const backendEndpointsDoc = `
[RATIO'D BACKEND SYSTEM - api.getratiod.lol]
Base URL: https://api.getratiod.lol
Endpoints:
- POST /login: Authenticates against SRM Academia with username, password, captcha. Returns full student dataset (profile, attendance, marks, timetable, dayOrder).
- POST /refresh: High-speed background sync using cached credentials/cookies to update marks and attendance in sub-second time.
- POST /portal/login & /portal/refresh: Fallback authentication against student portal.
- POST /portal/captcha & /captcha/solve: Automated OCR solver for login security codes.
- GET /pyq-proxy: Retrieves previous years' question papers, solutions, and syllabi by subject code.
- GET /api/announcements: Live college announcements, timetable changes, and campus notifications.
- POST /feedback: Drops telemetry and student bug reports.

[SRM ACADEMIC CRITERIA & RULES]
- 75% Attendance Requirement: Students MUST maintain >= 75% in each subject to sit for semester examinations without condonation or debarment.
  * Bunk Calculation Formula:
    If Attendance >= 75%: Safe bunks remaining = Math.floor((present - 0.75 * conducted) / 0.75)
    If Attendance < 75%: Classes required consecutively to reach 75% = Math.ceil((0.75 * conducted - present) / 0.25)
- SRM 10-Point CGPA Scale: O (90-100), A+ (80-89), A (70-79), B+ (60-69), B (50-59), C (45-49), P (40-44), F (<40).
- Internals: CLA-1, CLA-2, CLA-3, and semester internal tests form the basis of the internal mark weighting.
`;

    // Format live student data context if available
    let studentDataSummary = "No active student session detected (guest/demo state).";
    if (studentContext) {
      const p = studentContext.profile || {};
      const att = Array.isArray(studentContext.attendance) ? studentContext.attendance : [];
      const mrk = Array.isArray(studentContext.marks) ? studentContext.marks : [];
      const dayOrder = studentContext.dayOrder || p.dayOrder || "N/A";

      const attendanceList = att
        .map((a: any) => {
          const pct = parseFloat(a.percent) || 0;
          const cond = parseInt(a.conducted) || 0;
          const pres = parseInt(a.present) || 0;
          const abs = parseInt(a.absent) || 0;
          let bunkInfo = "";
          if (pct >= 75) {
            const bunks = Math.floor((pres - 0.75 * cond) / 0.75);
            bunkInfo = `Safe bunks remaining: ${Math.max(0, bunks)}`;
          } else {
            const needed = Math.ceil((0.75 * cond - pres) / 0.25);
            bunkInfo = `CRITICAL: Must attend ${needed} classes consecutively to hit 75%`;
          }
          return `• ${a.course || a.code} (${a.code || "N/A"}): ${pct}% [Conducted: ${cond}, Attended: ${pres}, Absent: ${abs}] -> ${bunkInfo}`;
        })
        .join("\n");

      const marksList = mrk
        .map((m: any) => {
          const assessments = (m.assessments || [])
            .map((ass: any) => `${ass.title || "Test"}: ${ass.marks}/${ass.total}`)
            .join(", ");
          return `• ${m.course || m.code}: Total: ${m.totalGot ?? "N/A"}/${m.totalMax ?? "N/A"} (${m.percentage ?? "N/A"}%) [${assessments || "No tests entered"}]`;
        })
        .join("\n");

      studentDataSummary = `
[LIVE LOGGED-IN STUDENT DATA]
Name: ${p.name || "Student"}
Registration Number: ${p.regNo || "N/A"}
Department: ${p.dept || "N/A"} | Semester: ${p.semester || "N/A"} | Section: ${p.section || "N/A"}
Current CGPA: ${p.cgpa || "N/A"}
Today's Day Order: ${dayOrder}

--- SUBJECT-WISE ATTENDANCE ---
${attendanceList || "No attendance records available."}

--- SUBJECT-WISE MARKS ---
${marksList || "No marks records available."}
`;
    }

    const systemPromptContent = `You are the intelligent core of ratio'd (the student dashboard for SRM students), powered by Sarvam AI (105B).
Your personality: chill, sharp, concise, gen-z friendly, and hyper-accurate with numbers.
You speak fluent English, Hinglish, Tamil, Telugu, Hindi, or any Indic language the student prefers.

${backendEndpointsDoc}

${studentDataSummary}

INSTRUCTIONS FOR RESPONSES:
1. Output cleanly formatted PLAIN TEXT ONLY. NEVER use markdown symbols like asterisks (** or *), markdown headers (#), or backticks.
2. Structure responses into short, highly readable paragraphs with clean blank lines between them.
3. For lists of subjects or advice, use clean bullet dots "• " or simple numbers "1. ", "2. ".
4. Always base attendance and bunk advice on the REAL numbers provided above whenever available.
5. If asked "Can I bunk?", calculate exact safe bunks or required classes using the formulas above.
6. If asked about marks, calculate what they need in remaining internals or end-semester finals to hit their target grade/CGPA.
7. Keep insights direct, punchy, and actionable—avoid fluff.
8. If the student speaks or asks in Hindi, Hinglish, Tamil, or Telugu, respond naturally in that language or code-mix.`;

    const finalMessages = [
      { role: "system", content: systemPromptContent },
      ...messages.filter((m: any) => m.role !== "system"),
    ];

    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        model: "sarvam-105b-conversations",
        messages: finalMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Sarvam API error: ${response.status} - ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No reply from Sarvam AI.";

    return NextResponse.json({
      content: reply,
      usage: data?.usage,
    });
  } catch (error: any) {
    console.error("Sarvam API route error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
