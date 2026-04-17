export interface OllamaParsedResult {
  type: "task" | "event";
  content: string;
  subtasks?: string[];
  timestamp?: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly" | number;
  reminderDays?: number;
}

export const parseNaturalLanguage = async (text: string): Promise<OllamaParsedResult> => {
  try {
    const response = await fetch('/api/parse', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi máy chủ (Status: ${response.status})`);
    }

    const data = await response.json();
    
    // Đảm bảo parse JSON an toàn
    let resultJSON = data.result;
    
    // Nếu ollama trả về markdown block (ví dụ: ```json ... ```) thì cần lọc bỏ
    if (resultJSON.includes("\`\`\`json")) {
        resultJSON = resultJSON.replace(/\`\`\`json\n/g, "").replace(/\`\`\`\n?/g, "");
    }
    
    const result: OllamaParsedResult = JSON.parse(resultJSON.trim());
    return result;

  } catch (error) {
    console.error("Error calling Ollama API:", error);
    throw error;
  }
};
