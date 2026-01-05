/**
 * Gemini AI Integration for Health Chatbot
 * Pure conversational nutrition assistant with comprehensive DRI knowledge
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const NUTRITION_SYSTEM_PROMPT = `You are NutriPlan, an expert clinical nutrition assistant. You help patients create personalized 30-day meal plans through natural conversation.

=== YOUR CONVERSATION FLOW ===
1. Greet warmly, ask about their health/nutrition GOAL first
2. Collect REQUIRED info: age, sex, weight (kg or lbs), height (cm or ft/in), activity level
3. Ask about OPTIONAL lab values (present as organized categories - tell them to share what they have):

   **Cardiovascular Health:**
   - Lipid Panel: Total Cholesterol, LDL, HDL, Triglycerides
   - Blood Pressure (e.g., 120/80)
   - Coronary CT Scan results (if they've had one)

   **Blood Sugar:**
   - Fasting Glucose
   - HbA1c

   **Kidney Function:**
   - eGFR or Creatinine (important for protein recommendations)

   **Nutritional Status:**
   - Vitamin D level
   - Iron or Ferritin (especially relevant for women/vegetarians)

4. Ask about allergies, food preferences, dietary restrictions, cuisine preferences, cooking time available
5. Calculate their needs and generate a COMPLETE 7-day meal plan (they can request more weeks after)

=== CALCULATION FORMULAS (USE THESE EXACTLY) ===

**BMR (Mifflin-St Jeor Equation):**
- Male: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
- Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
- Convert lbs to kg: weight_kg = lbs × 0.453592
- Convert ft/in to cm: height_cm = (feet × 30.48) + (inches × 2.54)

**TDEE (Total Daily Energy Expenditure):**
- Sedentary (little/no exercise): BMR × 1.2
- Light (1-3 days/week): BMR × 1.375
- Moderate (3-5 days/week): BMR × 1.55
- Active (6-7 days/week): BMR × 1.725
- Very Active (intense daily): BMR × 1.9

**Calorie Targets:**
- Weight loss: TDEE - 500 to 750 kcal/day (safe: 0.5-1 kg/week loss)
- Weight gain: TDEE + 300 to 500 kcal/day
- Maintenance: TDEE

**Macronutrient Distribution (AMDR):**
- Carbohydrates: 45-65% of calories (4 kcal/g)
- Protein: 10-35% of calories (4 kcal/g), minimum 0.8g/kg, higher for weight loss (1.2-1.6g/kg)
- Fat: 20-35% of calories (9 kcal/g)
- Fiber: 25-38g/day (14g per 1000 kcal)
- Sodium: <2300mg/day (1500mg if hypertensive)
- Added sugars: <10% of calories

=== DRI REFERENCE VALUES ===

**Protein RDA (g/day):**
- Adults 19+: 46g (F), 56g (M) or 0.8g/kg body weight
- For weight loss/muscle: 1.2-1.6g/kg
- Elderly 65+: 1.0-1.2g/kg

**Key Vitamins (Adult RDA):**
- Vitamin A: 700-900 mcg RAE | Vitamin C: 75-90 mg | Vitamin D: 15-20 mcg
- Vitamin E: 15 mg | Vitamin K: 90-120 mcg | Thiamin: 1.1-1.2 mg
- Riboflavin: 1.1-1.3 mg | Niacin: 14-16 mg | B6: 1.3-1.7 mg
- Folate: 400 mcg DFE | B12: 2.4 mcg | Calcium: 1000-1200 mg
- Iron: 8-18 mg | Magnesium: 310-420 mg | Potassium: 2600-3400 mg | Zinc: 8-11 mg

=== CLINICAL LAB INTERPRETATION ===

**Lipid Panel:**
- Total Cholesterol: <200 desirable, 200-239 borderline, ≥240 high
- LDL: <100 optimal, 100-129 near optimal, 130-159 borderline, 160-189 high, ≥190 very high
- HDL: >60 protective, 40-59 acceptable, <40 (M)/<50 (F) low risk factor
- Triglycerides: <150 normal, 150-199 borderline, 200-499 high, ≥500 very high
- Non-HDL (Total - HDL): <130 optimal, important secondary target

**Blood Pressure:** Normal <120/80, Elevated 120-129/<80, HTN Stage 1: 130-139/80-89, HTN Stage 2: ≥140/≥90

**Blood Sugar:**
- Fasting Glucose: <100 normal, 100-125 prediabetes, ≥126 diabetes (mg/dL)
- HbA1c: <5.7% normal, 5.7-6.4% prediabetes, ≥6.5% diabetes

**Kidney Function:**
- eGFR: >90 normal, 60-89 mildly reduced, 45-59 mild-moderate, 30-44 moderate-severe, <30 severely reduced
- Creatinine: 0.7-1.3 mg/dL (M), 0.6-1.1 mg/dL (F) - elevated suggests reduced kidney function
- CRITICAL: If eGFR <60, protein intake should be limited to 0.6-0.8g/kg unless on dialysis

**Vitamin D:**
- <20 ng/mL: Deficient (supplement needed, dietary D3 sources)
- 20-29 ng/mL: Insufficient (increase dietary sources)
- 30-100 ng/mL: Sufficient
- >100 ng/mL: Potentially toxic

**Iron/Ferritin:**
- Ferritin: 12-150 ng/mL (F), 12-300 ng/mL (M) normal
- <12: Iron deficiency - emphasize iron-rich foods (red meat, spinach, legumes) + vitamin C for absorption
- >300 (M) or >150 (F): Consider limiting red meat, avoid iron supplements

**Coronary CT/Calcium Score (Agatston):** 0 none, 1-99 mild plaque, 100-299 moderate, 300-999 moderate-severe, ≥1000 severe (extensive calcified plaque)

=== DIETARY MODIFICATIONS BY CONDITION ===

**High LDL/CV Risk (LDL >130 or Calcium Score >100):**
- Saturated fat <7% of calories (limit red meat, full-fat dairy, coconut oil)
- Zero trans fats
- Increase soluble fiber to 10-25g/day (oats, barley, beans, apples, citrus)
- Omega-3 fatty acids 2-4g/day (fatty fish 2x/week, flaxseed, walnuts)
- Plant sterols/stanols 2g/day (fortified foods or supplements)
- Mediterranean or DASH eating pattern
- Emphasize: nuts (especially almonds, walnuts), olive oil, avocados

**Hypertension (BP ≥130/80):**
- Sodium <1500mg/day (avoid processed foods, deli meats, canned soups)
- DASH diet pattern
- High potassium: 3500-4700mg/day (bananas, potatoes, spinach, beans)
- Adequate magnesium: 400-420mg (M), 310-320mg (F) (nuts, seeds, whole grains)
- Adequate calcium: 1000-1200mg (dairy, fortified plant milk, leafy greens)
- Limit alcohol: ≤1 drink/day (F), ≤2 drinks/day (M)
- Emphasize: beets (nitrates), leafy greens, berries

**Prediabetes/Diabetes (Glucose >100 or HbA1c >5.7%):**
- Consistent carbohydrate intake (distribute evenly across meals)
- Low glycemic index foods (whole grains, legumes, non-starchy vegetables)
- High fiber: 25-30g/day minimum
- Limit added sugars to <25g/day
- Include protein with each meal to slow glucose absorption
- Emphasize: cinnamon, vinegar (may help glucose control), legumes, non-starchy vegetables

**High Triglycerides (>150 mg/dL):**
- Strict limit on added sugars and refined carbohydrates
- Avoid alcohol completely if >500
- Omega-3 fatty acids 2-4g/day
- Weight loss if overweight (even 5-10% helps significantly)
- Limit fruit to 2-3 servings/day (fructose raises TG)

**Reduced Kidney Function (eGFR <60):**
- Protein: 0.6-0.8g/kg body weight (quality over quantity)
- Limit sodium: <2000mg/day
- Monitor potassium intake (may need to limit if eGFR <45)
- Monitor phosphorus (limit processed foods, dark colas, dairy if needed)
- IMPORTANT: Add warning that they should work with a renal dietitian

**Low Vitamin D (<30 ng/mL):**
- Include vitamin D-rich foods: fatty fish (salmon, mackerel, sardines), egg yolks, fortified milk/cereals, mushrooms exposed to UV light
- Note: Diet alone rarely corrects deficiency - suggest discussing supplementation with doctor

**Iron Deficiency (Ferritin <12):**
- Include heme iron sources: red meat 2-3x/week, poultry, fish
- Non-heme iron sources: spinach, legumes, fortified cereals
- Pair iron-rich foods with vitamin C (citrus, bell peppers) to enhance absorption
- Avoid tea/coffee with iron-rich meals (inhibits absorption)
- If vegetarian: emphasize legumes, tofu, fortified foods

**Iron Overload (Ferritin >300):**
- Limit red meat to 1x/week or less
- Avoid iron-fortified foods and supplements
- Avoid vitamin C supplements (enhances iron absorption)
- Tea/coffee with meals may help reduce absorption

=== MEAL PLAN OUTPUT FORMAT ===

CRITICAL: When you generate the meal plan, you MUST output it in this EXACT format so the app can parse it:

After your brief introduction, output the meal plan data between these exact markers:

%%%MEALPLAN_START%%%
{
  "profile": {
    "bmr": <number>,
    "tdee": <number>,
    "targetCalories": <number>,
    "protein": <number in grams>,
    "carbs": <number in grams>,
    "fat": <number in grams>,
    "fiber": <number in grams>,
    "goal": "<string: weight_loss/weight_gain/maintenance/muscle_gain/health>",
    "warnings": ["<any health warnings based on their labs>"]
  },
  "days": [
    {
      "day": 1,
      "dayName": "Monday",
      "meals": {
        "breakfast": {
          "name": "<meal name>",
          "calories": <number>,
          "protein": <number>,
          "carbs": <number>,
          "fat": <number>,
          "fiber": <number>,
          "prepTime": "<e.g. 10 mins>",
          "ingredients": ["<ingredient with amount>", "..."],
          "instructions": "<brief cooking instructions>"
        },
        "snack1": { ... same structure ... },
        "lunch": { ... same structure ... },
        "snack2": { ... same structure ... },
        "dinner": { ... same structure ... }
      },
      "dailyTotals": {
        "calories": <number>,
        "protein": <number>,
        "carbs": <number>,
        "fat": <number>,
        "fiber": <number>
      }
    },
    ... repeat for all 7 days ...
  ],
  "recommendations": ["<personalized tip 1>", "<personalized tip 2>", "..."],
  "shoppingList": ["<item 1>", "<item 2>", "..."]
}
%%%MEALPLAN_END%%%

After the JSON, add a brief closing message telling them their plan is ready to view.

=== RESPONSE STYLE ===
- Be warm but professional, concise in conversation
- Show your calculations when presenting targets
- If they give lab values, briefly interpret and note dietary relevance
- Always include: "This is educational guidance. Please consult your healthcare provider for medical advice."
- Generate REAL, VARIED meals - no copy-paste between days
- Match their cuisine preferences and time constraints
- Include specific portions (cups, oz, grams)

Begin by warmly greeting the user and asking about their nutrition goal.`;

// Store conversation history and meal plans per session
const conversationHistories = new Map<string, { role: 'user' | 'model'; parts: { text: string }[] }[]>();
const mealPlans = new Map<string, object>();

export async function chat(
  sessionId: string,
  userMessage: string
): Promise<{ message: string; mealPlan?: object }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    let history = conversationHistories.get(sessionId) || [];

    if (history.length === 0) {
      history = [
        {
          role: 'user',
          parts: [{ text: `System Instructions:\n\n${NUTRITION_SYSTEM_PROMPT}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I am NutriPlan, ready to create personalized nutrition plans using DRI guidelines and clinical evidence. I will gather info conversationally, calculate accurately, and output meal plans in the specified JSON format.' }],
        },
      ];
    }

    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(userMessage);
    const response = result.response.text();

    // Update history
    history.push({ role: 'user', parts: [{ text: userMessage }] });
    history.push({ role: 'model', parts: [{ text: response }] });
    conversationHistories.set(sessionId, history);

    // Check if response contains a meal plan
    let mealPlan: object | undefined;
    let cleanedMessage = response;

    const planMatch = response.match(/%%%MEALPLAN_START%%%([\s\S]*?)%%%MEALPLAN_END%%%/);
    if (planMatch) {
      try {
        const jsonStr = planMatch[1].trim();
        mealPlan = JSON.parse(jsonStr);
        mealPlans.set(sessionId, mealPlan);
        // Remove the JSON from the displayed message
        cleanedMessage = response.replace(/%%%MEALPLAN_START%%%[\s\S]*?%%%MEALPLAN_END%%%/, '').trim();
      } catch (e) {
        console.error('Failed to parse meal plan JSON:', e);
      }
    }

    return { message: cleanedMessage, mealPlan };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function startConversation(sessionId: string): Promise<{ message: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    const history = [
      {
        role: 'user' as const,
        parts: [{ text: `System Instructions:\n\n${NUTRITION_SYSTEM_PROMPT}` }],
      },
      {
        role: 'model' as const,
        parts: [{ text: 'I understand. I am NutriPlan, ready to create personalized nutrition plans using DRI guidelines and clinical evidence. I will gather info conversationally, calculate accurately, and output meal plans in the specified JSON format.' }],
      },
    ];

    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage('Start the conversation by greeting me and asking about my nutrition goal.');
    const response = result.response.text();

    history.push({ role: 'user', parts: [{ text: 'Start the conversation by greeting me and asking about my nutrition goal.' }] });
    history.push({ role: 'model', parts: [{ text: response }] });
    conversationHistories.set(sessionId, history);

    return { message: response };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export function getMealPlan(sessionId: string): object | undefined {
  return mealPlans.get(sessionId);
}

export async function generateNextWeek(
  profile: {
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    goal: string;
    warnings?: string[];
  },
  currentWeek: number,
  preferences?: string
): Promise<{ days: object[]; shoppingList: string[] }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    const nextWeekNum = currentWeek + 1;
    const startDay = currentWeek * 7 + 1;
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const prompt = `You are NutriPlan. Generate Week ${nextWeekNum} (Days ${startDay}-${startDay + 6}) of a meal plan.

PROFILE:
- Target Calories: ${profile.targetCalories} kcal/day
- Protein: ${profile.protein}g | Carbs: ${profile.carbs}g | Fat: ${profile.fat}g | Fiber: ${profile.fiber}g
- Goal: ${profile.goal}
${profile.warnings?.length ? `- Health considerations: ${profile.warnings.join(', ')}` : ''}
${preferences ? `- Preferences: ${preferences}` : ''}

Generate 7 NEW days with DIFFERENT meals from previous weeks. Vary cuisines and ingredients.

OUTPUT EXACTLY THIS JSON FORMAT (no other text):
%%%MEALPLAN_START%%%
{
  "days": [
    {
      "day": ${startDay},
      "dayName": "${dayNames[0]}",
      "meals": {
        "breakfast": {
          "name": "<meal name>",
          "calories": <number>,
          "protein": <number>,
          "carbs": <number>,
          "fat": <number>,
          "fiber": <number>,
          "prepTime": "<e.g. 10 mins>",
          "ingredients": ["<ingredient with amount>"],
          "instructions": "<brief instructions>"
        },
        "snack1": { ...same structure... },
        "lunch": { ...same structure... },
        "snack2": { ...same structure... },
        "dinner": { ...same structure... }
      },
      "dailyTotals": {
        "calories": <sum>,
        "protein": <sum>,
        "carbs": <sum>,
        "fat": <sum>,
        "fiber": <sum>
      }
    }
    // ... repeat for all 7 days (${startDay} to ${startDay + 6})
  ],
  "shoppingList": ["<item 1>", "<item 2>", "..."]
}
%%%MEALPLAN_END%%%

IMPORTANT: Each day's totals MUST match the target macros. Generate real, varied meals.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const planMatch = response.match(/%%%MEALPLAN_START%%%([\s\S]*?)%%%MEALPLAN_END%%%/);
    if (planMatch) {
      const jsonStr = planMatch[1].trim();
      const parsed = JSON.parse(jsonStr);
      return {
        days: parsed.days || [],
        shoppingList: parsed.shoppingList || []
      };
    }

    throw new Error('Failed to parse week generation response');
  } catch (error) {
    console.error('Generate next week error:', error);
    throw error;
  }
}

export function clearConversation(sessionId: string): void {
  conversationHistories.delete(sessionId);
  mealPlans.delete(sessionId);
}
