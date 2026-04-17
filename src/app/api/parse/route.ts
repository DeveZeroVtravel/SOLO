import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || "qwen2.5";
    
    // Inject current Date so the AI has a reference point for today/tomorrow/etc.
    const now = new Date();
    const systemDate = now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "full", timeStyle: "long" });

    const dayNames = ["chủ nhật", "thứ 2", "thứ 3", "thứ 4", "thứ 5", "thứ 6", "thứ 7"];
    const upcomingDays = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        let dayIdx = d.getDay();
        let short = dayIdx === 0 ? "cn" : "t" + (dayIdx + 1);
        let prefix = dayNames[dayIdx] + ` (${short})`;
        if (i === 0) prefix = "Hôm nay, " + prefix;
        if (i === 1) prefix = "Ngày mai, " + prefix;
        return prefix + " -> " + d.toISOString().split('T')[0];
    }).join('\\n');

    const prompt = `
<Context>
Today is ${systemDate}.
</Context>

<ReferenceTable>
ISO Date reference for the next 7 days (Use these to fill the "timestamp" field):
${upcomingDays}
</ReferenceTable>

<Rules>
1. [Classification] Return "event" if the input includes a specific TIME (e.g., "6h", "PM", "chiều"). Return "task" if it only contains a DATE/DAY (e.g., "T7", "tomorrow") or NO time information at all.
2. [DateMapping] When a Vietnamese Day/Date is found (e.g., "T7", "mai", "t2"), look up the <ReferenceTable> and copy the exact YYYY-MM-DD string. If no date is mentioned, return "".
3. [TitleExtraction] CRITICAL: COPY the title VERBATIM from the original input. DO NOT correct spelling, DO NOT translate the title, and DO NOT paraphrase. (e.g., "chạy bộ" must remain "chạy bộ").
</Rules>

<Examples>
- Input: "thuyết trình T7"
  Output: {"type":"task","content":"thuyết trình","subtasks":[],"timestamp":"[ISO Date for T7 from table]","recurrence":"none","reminderDays":0}
- Input: "Họp 3h chiều mai"
  Output: {"type":"event","content":"Họp","subtasks":[],"timestamp":"[ISO Date for tomorrow]T15:00:00+07:00","recurrence":"none","reminderDays":0}
- Input: "chạy bộ 7h chiều hôm nay"
  Output: {"type":"event","content":"chạy bộ","subtasks":[],"timestamp":"[ISO Date for today]T19:00:00+07:00","recurrence":"none","reminderDays":0}
</Examples>

<Task>
Analyze the following Vietnamese input and return ONLY a valid JSON block (no markdown, no explanations):
Input: "${text}"
</Task>`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 mins timeout

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1
          },
          format: "json"
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ result: data.response });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'Ollama took too long to respond (Timeout)' }, { status: 504 });
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
