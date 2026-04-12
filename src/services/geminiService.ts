import { GoogleGenAI, ThinkingLevel, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const logMealTool: FunctionDeclaration = {
  name: "log_meal",
  description: "Log a meal with its estimated calories. Use this when the user says what they ate.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      meal_name: { type: Type.STRING, description: "Name of the food/meal" },
      calories: { type: Type.NUMBER, description: "Estimated calories. Use Google Search to estimate if unsure." },
      timestamp: { type: Type.STRING, description: "Time of consumption (e.g. '12:30 PM', 'just now')" }
    },
    required: ["meal_name", "calories", "timestamp"]
  }
};

const logWeightTool: FunctionDeclaration = {
  name: "log_weight",
  description: "Log the user's current weight.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      weight_kg: { type: Type.NUMBER, description: "Weight in kilograms" },
      timestamp: { type: Type.STRING, description: "Time of measurement" }
    },
    required: ["weight_kg", "timestamp"]
  }
};

const logExerciseTool: FunctionDeclaration = {
  name: "log_exercise",
  description: "Log an exercise session.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      exercise_type: { type: Type.STRING, description: "Type of exercise (e.g. walking, running, yoga)" },
      duration_minutes: { type: Type.NUMBER, description: "Duration in minutes" },
      timestamp: { type: Type.STRING, description: "Time of exercise" }
    },
    required: ["exercise_type", "duration_minutes", "timestamp"]
  }
};

const logBpTool: FunctionDeclaration = {
  name: "log_bp",
  description: "Log a blood pressure reading.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      systolic: { type: Type.NUMBER, description: "Systolic pressure (top number)" },
      diastolic: { type: Type.NUMBER, description: "Diastolic pressure (bottom number)" },
      timestamp: { type: Type.STRING, description: "Time of measurement" }
    },
    required: ["systolic", "diastolic", "timestamp"]
  }
};

const logLipidsTool: FunctionDeclaration = {
  name: "log_lipids",
  description: "Log blood plasma and lipid levels (e.g., fasting glucose, triglycerides, HDL, LDL).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fasting_glucose: { type: Type.NUMBER, description: "Fasting glucose in mg/dL" },
      triglycerides: { type: Type.NUMBER, description: "Triglycerides in mg/dL" },
      hdl: { type: Type.NUMBER, description: "HDL cholesterol in mg/dL" },
      ldl: { type: Type.NUMBER, description: "LDL cholesterol in mg/dL" },
      timestamp: { type: Type.STRING, description: "Time of measurement" }
    },
    required: ["timestamp"]
  }
};

const logBodyParamsTool: FunctionDeclaration = {
  name: "log_body_parameters",
  description: "Log body parameters like waist circumference.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      waist_cm: { type: Type.NUMBER, description: "Waist circumference in centimeters" },
      timestamp: { type: Type.STRING, description: "Time of measurement" }
    },
    required: ["waist_cm", "timestamp"]
  }
};

export async function sendChatMessage(history: any[]) {
  const contents = history.map(msg => {
    const parts = [];
    if (msg.text) parts.push({ text: msg.text });
    if (msg.image) {
      const mimeType = msg.image.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
      const data = msg.image.split(',')[1];
      parts.push({ inlineData: { data, mimeType } });
    }
    if (msg.functionCall) parts.push({ functionCall: msg.functionCall });
    if (msg.functionResponse) parts.push({ functionResponse: msg.functionResponse });

    let role = msg.role === 'ai' ? 'model' : 'user';
    if (msg.functionResponse) role = 'user';
    if (msg.functionCall) role = 'model';

    return { role, parts };
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents,
    config: {
      systemInstruction: "You are a specialized cardiometabolic health assistant for South Asian adults. Help users log meals, weight, exercise, blood pressure, and other health metrics. When users describe food, analyze it for South Asian cuisine and estimate calories accurately. If a user uploads a food image, identify it and estimate calories. Use provided tools to suggest logging. Be encouraging, provide South Asian diet tips, and focus on preventing Type 2 Diabetes, Hypertension, and Cardiovascular Disease.",
      tools: [
        { functionDeclarations: [logMealTool, logWeightTool, logExerciseTool, logBpTool, logLipidsTool, logBodyParamsTool] },
        { googleSearch: {} }
      ]
    }
  });

  return {
    text: response.text,
    functionCall: response.functionCalls?.[0]
  };
}

export async function getHealthAdvice(prompt: string, complex: boolean = false) {
  if (complex) {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        systemInstruction: "You are a specialized cardiometabolic health assistant for South Asian adults. Provide evidence-based advice on preventing Type 2 Diabetes, Hypertension, and Cardiovascular Disease. Focus on culturally relevant diet (South Asian cuisine) and lifestyle modifications. Be professional, encouraging, and clinical.",
      },
    });
    return response.text;
  } else {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful health assistant. Provide quick, accurate, and concise answers to health-related queries for South Asian adults.",
      },
    });
    return response.text;
  }
}

export async function analyzeMeal(mealDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: `Analyze this meal for a South Asian adult concerned about cardiometabolic risk: "${mealDescription}". Provide estimated calories and a brief health tip.`,
    config: {
      responseMimeType: "application/json",
    },
  });
  return response.text;
}
