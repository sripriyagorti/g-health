import { Ollama } from "ollama";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";

const isCloud = process.env.OLLAMA_API_KEY;

const ollamaClient = isCloud
  ? new Ollama({
      host: "https://ollama.com",
      headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
    })
  : new Ollama();

const toolSchemas = [
  {
    type: "function",
    function: {
      name: "log_meal",
      description: "Log a meal with nutrition details.",
      parameters: {
        type: "object",
        properties: {
          meal_name: {
            type: "string",
            description: "Name of food/meal (e.g. 'Chicken tikka masala')",
          },
          portion_size: {
            type: "string",
            description: "Portion (e.g. '1 cup', '200g')",
          },
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
          exercise_type: {
            type: "string",
            description: "Type (e.g. brisk walking, yoga)",
          },
          duration_minutes: {
            type: "number",
            description: "Duration in minutes",
          },
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
            enum: [
              "fasting_glucose",
              "total_cholesterol",
              "hdl",
              "ldl",
              "triglycerides",
              "crp",
              "homocysteine",
              "uric_acid",
              "hba1c",
            ],
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
          portion_size: {
            type: "string",
            description: "Portion (e.g. '100g', '1 cup')",
          },
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
          user_risk_profile: {
            type: "string",
            enum: ["Low", "Moderate", "High"],
          },
          focus_area: {
            type: "string",
            enum: ["diet", "exercise", "weight", "bp", "overall"],
          },
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
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_bp_trend",
      description: "Fetch 60-day blood pressure history.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_calorie_trend",
      description: "Fetch 30-day daily calorie intake.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
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
            enum: [
              "fasting_glucose",
              "total_cholesterol",
              "hdl",
              "ldl",
              "triglycerides",
              "crp",
              "hba1c",
            ],
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

export const SYSTEM_PROMPT = `You are MetaboPrevent, a brief, direct health coach for South Asian adults.

## CRITICAL RULES

1. ALWAYS call the appropriate function for loggable data. NEVER just say "I've logged".
2. Say "I'll log this—confirm below" (never past tense).
3. For meals: call get_food_nutrition_data FIRST, then log_meal.
4. For labs/biomarkers/meds/weight/BP/exercise: call the matching function.
5. For medication photos or lab reports: call extract_lab_results to parse the image.
6. For adding new meds: call add_medication with name, dosage, frequency.
7. For "I took medicine today": call log_medication_taken with med name.

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
  name: string;
  args?: Record<string, any>;
}

async function callOllama(messages: any[], userContext?: string) {
  const systemMsg = userContext
    ? `${SYSTEM_PROMPT}\n\nUSER CONTEXT:\n${userContext}`
    : SYSTEM_PROMPT;

  try {
    const response = await ollamaClient.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: systemMsg }, ...messages],
      tools: toolSchemas,
      stream: false,
      options: {
        temperature: 0.6,
      },
    });

    let text = response.message?.content || "";
    let calls: ToolCall[] = [];

    if (response.message?.tool_calls) {
      calls = response.message.tool_calls.map((tc: any) => ({
        name: tc.function?.name || tc.name,
        args: tc.function?.arguments
          ? typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments
          : tc.arguments,
      }));
    }

    return { text, calls };
  } catch (err: any) {
    console.error("Ollama chat error:", err.message || err);
    const fallbackText = isCloud
      ? "Chat temporarily unavailable. Please try again."
      : "Chat unavailable. Is Ollama running locally?";
    return { text: fallbackText, calls: [] };
  }
}

export async function generateAgentResponse(
  contents: ChatContent[],
  userContext?: string,
) {
  const messages = contents.map((c) => ({
    role: c.role,
    content: c.parts.map((p: any) => p.text || JSON.stringify(p)).join("\n"),
  }));

  return callOllama(messages, userContext);
}

export async function getHealthAdvice(prompt: string) {
  try {
    const response = await ollamaClient.chat({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      stream: false,
      options: {
        temperature: 0.7,
      },
    });

    return response.message?.content || "";
  } catch (err: any) {
    console.error("getHealthAdvice error:", err.message || err);
    return "Chat unavailable. Please try again.";
  }
}