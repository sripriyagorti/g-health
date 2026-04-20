import OpenAI from "openai";

export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5-nano";
export const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const toolSchemas = [
  {
    type: "function",
    function: {
      name: "log_meal",
      description: "Log a meal with nutrition details.",
      parameters: {
        type: "object",
        properties: {
          meal_name: { type: "string", description: "Name of food/meal (e.g. 'Chicken tikka masala')" },
          portion_size: { type: "string", description: "Portion (e.g. '1 cup', '200g')" },
          calories: { type: "number", description: "Total calories" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
          fiber_g: { type: "number" },
          sodium_mg: { type: "number" },
          usda_fdc_id: { type: "string" },
          timestamp: { type: "string" },
        },
        required: ["meal_name", "portion_size", "calories", "timestamp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_weight",
      description: "Log weight measurement.",
      parameters: {
        type: "object",
        properties: {
          weight_kg: { type: "number", description: "Weight in kilograms" },
          timestamp: { type: "string", description: "Time of measurement" },
        },
        required: ["weight_kg", "timestamp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_bp",
      description: "Log blood pressure reading.",
      parameters: {
        type: "object",
        properties: {
          systolic: { type: "number", description: "Systolic (top)" },
          diastolic: { type: "number", description: "Diastolic (bottom)" },
          timestamp: { type: "string", description: "Time" },
        },
        required: ["systolic", "diastolic", "timestamp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_exercise",
      description: "Log exercise or physical activity.",
      parameters: {
        type: "object",
        properties: {
          exercise_type: { type: "string", description: "Type (e.g. brisk walking, yoga)" },
          duration_minutes: { type: "number", description: "Duration in minutes" },
          intensity: { type: "string", enum: ["light", "moderate", "vigorous"] },
          timestamp: { type: "string", description: "Time" },
        },
        required: ["exercise_type", "duration_minutes", "timestamp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_biomarker",
      description: "Log a blood test result (cholesterol, glucose, CRP, etc).",
      parameters: {
        type: "object",
        properties: {
          marker_type: {
            type: "string",
            enum: ["fasting_glucose", "total_cholesterol", "hdl", "ldl", "triglycerides", "crp", "homocysteine", "uric_acid", "hba1c"],
          },
          value: { type: "number", description: "Measured value" },
          unit: { type: "string", description: "Unit (mg/dL, %, etc)" },
          test_date: { type: "string", description: "Date of test" },
        },
        required: ["marker_type", "value", "unit", "test_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_medication_adherence",
      description: "Log medication taken/not taken.",
      parameters: {
        type: "object",
        properties: {
          medication_name: { type: "string" },
          taken: { type: "boolean" },
          date: { type: "string", description: "YYYY-MM-DD" },
          notes: { type: "string" },
        },
        required: ["medication_name", "taken", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_food_nutrition_data",
      description: "Look up nutrition data from USDA FoodData Central.",
      parameters: {
        type: "object",
        properties: {
          food_query: { type: "string", description: "Food name to search" },
          portion_size: { type: "string", description: "Portion (e.g. '100g', '1 cup')" },
        },
        required: ["food_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_personalized_recommendation",
      description: "Provide a focused behavior-change recommendation.",
      parameters: {
        type: "object",
        properties: {
          user_risk_profile: { type: "string", enum: ["Low", "Moderate", "High"] },
          focus_area: { type: "string", enum: ["diet", "exercise", "weight", "bp", "overall"] },
        },
        required: ["user_risk_profile", "focus_area"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weight_trend",
      description: "Fetch 60-day weight history to analyze trend.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_bp_trend",
      description: "Fetch 60-day blood pressure history.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_calorie_trend",
      description: "Fetch 30-day daily calorie intake.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_biomarker_trend",
      description: "Fetch biomarker test history.",
      parameters: {
        type: "object",
        properties: {
          marker_type: {
            type: "string",
            enum: ["fasting_glucose", "total_cholesterol", "hdl", "ldl", "triglycerides", "crp", "hba1c"],
          },
        },
        required: ["marker_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_medication",
      description: "Add a new medication.",
      parameters: {
        type: "object",
        properties: {
          medication_name: { type: "string" },
          dosage: { type: "string" },
          frequency: { type: "string" },
          indication: { type: "string" },
        },
        required: ["medication_name", "dosage", "frequency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_medication_taken",
      description: "Log that user took a medication today.",
      parameters: {
        type: "object",
        properties: {
          medication_name: { type: "string" },
          timestamp: { type: "string" },
        },
        required: ["medication_name", "timestamp"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_lab_results",
      description: "Extract lab test results from image or text.",
      parameters: {
        type: "object",
        properties: {
          source: { type: "string", enum: ["photo", "text"] },
          glucose: { type: "number" },
          total_cholesterol: { type: "number" },
          hdl: { type: "number" },
          ldl: { type: "number" },
          triglycerides: { type: "number" },
          crp: { type: "number" },
          hba1c: { type: "number" },
          test_date: { type: "string" },
        },
        required: ["source"],
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are G-Health, a brief, direct health coach for South Asian adults.

## CRITICAL RULES

1. ALWAYS call the appropriate function for loggable data. NEVER just say "I've logged".
2. Say "I'll log this—confirm below" (never past tense).
3. For meals: call get_food_nutrition_data FIRST, then log_meal.
4. For labs/biomarkers/meds/weight/BP/exercise: call the matching function.
5. For medication photos or lab reports: call extract_lab_results to parse the image.
6. For adding new meds: call add_medication with name, dosage, frequency.
7. For "I took medicine today": call log_medication_taken with med name.
8. **MEAL + IMAGE**: When user mentions meal (breakfast/lunch/dinner/ate/had/food) WITH an image:
   - ALWAYS call get_food_nutrition_data based on what you see in the image
   - Then call log_meal with the extracted nutrition data
   - Do NOT ask follow-up questions—analyze the image and log immediately

## RESPONSE STYLE

- Max 2 sentences. Be direct, skip fluff.
- Use plain language: "bad cholesterol" not "dyslipidemia".
- Reference familiar South Asian foods: dal, roti, leafy greens, cucumber raita.
- Example: "Your 'bad cholesterol' is a bit high—eat more fiber, less ghee. Check your Dashboard."
- Never claim diagnosis. Always say "Talk to your doctor" if serious.`;

export type ChatPart = any;
export interface ChatContent {
  role: "user" | "model";
  parts: ChatPart[];
}

interface ToolCall {
  id?: string;
  name: string;
  args?: Record<string, any>;
}

function hasImages(contents: ChatContent[]): boolean {
  return contents.some(c => c.parts?.some((p: any) => p.inlineData));
}

function extractBase64(data: string, mimeType: string): string {
  if (data.startsWith("data:")) {
    const m = data.match(/data:([^;]+);base64,(.+)/);
    if (m) return m[2];
  }
  return data;
}

export function buildOpenAIMessages(
  contents: ChatContent[],
  systemMsg: string,
): OpenAI.ChatCompletionMessageParam[] {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMsg },
  ];

  for (const content of contents) {
    if (content.role === "model") {
      const toolCalls = content.parts
        .filter((p: any) => p.functionCall)
        .map((p: any, i: number) => ({
          id: p.functionCall.id || `call_${Date.now()}_${i}`,
          type: "function" as const,
          function: {
            name: p.functionCall.name,
            arguments: JSON.stringify(p.functionCall.args || {}),
          },
        }));

      const text = content.parts.find((p: any) => p.text)?.text ?? null;

      if (toolCalls.length > 0) {
        messages.push({ role: "assistant", content: text, tool_calls: toolCalls });
      } else if (text) {
        messages.push({ role: "assistant", content: text });
      }
    } else {
      const parts: OpenAI.ChatCompletionContentPart[] = [];
      const toolResults: string[] = [];

      for (const part of content.parts) {
        if (part.text) {
          parts.push({ type: "text", text: part.text });
        } else if (part.inlineData) {
          const mime = part.inlineData.mimeType || "image/jpeg";
          const base64 = extractBase64(part.inlineData.data, mime);
          parts.push({
            type: "image_url",
            image_url: { url: `data:${mime};base64,${base64}` },
          });
        } else if (part.functionResponse && !part.functionResponse.id) {
          // Non-native format — embed as text for backward compat
          toolResults.push(
            `[${part.functionResponse.name} result: ${JSON.stringify(part.functionResponse.response)}]`,
          );
        }
      }

      if (toolResults.length > 0) {
        parts.push({ type: "text", text: toolResults.join("\n") });
      }

      // Check for native tool responses (with tool_call_id)
      const toolResponses = content.parts
        .filter((p: any) => p.functionResponse?.id)
        .map((p: any) => ({
          role: "tool" as const,
          tool_call_id: p.functionResponse.id,
          content: JSON.stringify(p.functionResponse.response || {}),
        }));

      if (toolResponses.length > 0) {
        messages.push(...(toolResponses as any));
      }

      if (parts.length === 0 && toolResponses.length === 0) continue;

      if (parts.length > 0) {
        messages.push({
          role: "user",
          content: parts.length === 1 && parts[0].type === "text"
            ? (parts[0] as OpenAI.ChatCompletionContentPartText).text
            : parts,
        });
      }
    }
  }

  return messages;
}

export async function generateAgentResponse(
  contents: ChatContent[],
  userContext?: string,
): Promise<{ text: string; calls: ToolCall[] }> {
  const systemMsg = userContext
    ? `${SYSTEM_PROMPT}\n\nUSER CONTEXT:\n${userContext}`
    : SYSTEM_PROMPT;

  const imagesPresent = hasImages(contents);
  const model = imagesPresent ? VISION_MODEL : TEXT_MODEL;
  const messages = buildOpenAIMessages(contents, systemMsg);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      tools: toolSchemas as any,
      tool_choice: "auto",
    });

    const msg = response.choices[0]?.message;
    const text = msg?.content || "";
    const calls: ToolCall[] = (msg?.tool_calls || []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments || "{}"),
    }));

    return { text, calls };
  } catch (err: any) {
    console.error("[generateAgentResponse] OpenAI error:", err.message || err);
    if (imagesPresent) {
      return {
        text: "Image processing unavailable. Describe what you ate (e.g., '1 plate of dal rice').",
        calls: [],
      };
    }
    return { text: "Chat unavailable. Please try again.", calls: [] };
  }
}

export async function getHealthAdvice(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });
    return response.choices[0]?.message?.content || "";
  } catch (err: any) {
    console.error("[getHealthAdvice] error:", err.message || err);
    return "Chat unavailable. Please try again.";
  }
}
