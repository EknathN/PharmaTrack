"use client";

import { AiDashboardContext } from "@/app/actions/aiChat";

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (
          prompt: string | Array<{ role: string; content: string }>,
          options?: { model?: string; stream?: boolean }
        ) => Promise<any>;
        listModels?: () => Promise<any>;
      };
      auth?: {
        isSignedIn: () => boolean;
        signIn: () => Promise<any>;
      };
    };
  }
}

let puterLoadPromise: Promise<boolean> | null = null;

export function loadPuterScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.puter?.ai?.chat) return Promise.resolve(true);

  if (puterLoadPromise) return puterLoadPromise;

  puterLoadPromise = new Promise((resolve) => {
    // Check if script already exists in document
    const existing = document.querySelector('script[src*="js.puter.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      // Give short timeout in case already loaded
      setTimeout(() => {
        resolve(!!window.puter?.ai?.chat);
      }, 1000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => {
      // Small buffer for window.puter initialization
      setTimeout(() => {
        resolve(!!window.puter?.ai?.chat);
      }, 300);
    };
    script.onerror = () => {
      console.warn("Puter.js could not be loaded from CDN. Fallback analytical engine will be active.");
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return puterLoadPromise;
}

export function buildSystemPrompt(context: AiDashboardContext): string {
  const jsonSummary = JSON.stringify(
    {
      role: context.role,
      user: context.userName,
      operationalSummary: context.summary,
      metrics: context.metrics,
      activeStockOrBatches: context.inventoryOrBatches,
      salesOrMovementVelocity: context.salesOrMovement,
      recentShipments: context.shipments,
      stockoutRiskPredictions: context.stockoutPredictions,
      suggestedReorders: context.reorderRecommendations,
      nearExpiryBatches: context.nearExpiryRisks,
      activeAlerts: context.alerts,
    },
    null,
    2
  );

  return `You are PharmaTrack AI, an intelligent, specialized pharmaceutical supply chain analyst assistant built directly into the PharmaTrack Pro platform.
You are powered by Puter AI. You are assisting ${context.userName} (${context.role.toUpperCase()}).

CRITICAL INSTRUCTIONS & GUARDRAILS:
1. STRICT DATA SCOPE: You must answer questions based ONLY on the user's live dashboard data provided below. If a user asks about anything unrelated to their dashboard, medicines, stock, inventory, sales, shipments, disposal, or pharmaceutical operations (e.g. general trivia, coding, recipes, sports), politely decline and say: "I am your dedicated PharmaTrack Supply Chain Assistant. I can only assist with analysis, sales summaries, stockout predictions, and reorder recommendations for your dashboard data."
2. SALES & MOVEMENT ANALYSIS: When asked about sales or inventory movement, summarize the metrics clearly with bullet points, highlighting fast-moving vs slow-moving medicines.
3. STOCKOUT PREDICTIONS: When asked about stockouts or running out of stock, explicitly name the drugs at risk, their current units, burn rate, and days left before depletion based on the data.
4. DRUG REORDER RECOMMENDATIONS: When asked what to order, provide clear actionable recommendations with:
   - Medicine Name & Batch
   - Current Quantity
   - Suggested Reorder Quantity
   - Urgency Level (Immediate / High / Moderate)
   - Supplier to order from (e.g. Distributor or Manufacturer)
5. NEAR-EXPIRY RISK MITIGATION: Warn about any batches expiring within 30-60 days and recommend whether to prioritize sales (FEFO) or initiate return/disposal.
6. TONE & FORMAT: Professional, concise, highly authoritative, and executive. Use clean markdown formatting, bold text for drug names and numbers, bullet points, and warning tags (⚠️, 🔮, 💡, 📊).

LIVE DASHBOARD SNAPSHOT FOR THIS USER:
\`\`\`json
${jsonSummary}
\`\`\`
`;
}

export async function askPuterAi(
  userQuery: string,
  context: AiDashboardContext,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  const isLoaded = await loadPuterScript();

  if (isLoaded && window.puter?.ai?.chat) {
    try {
      const systemPrompt = buildSystemPrompt(context);
      
      // Build conversation context
      const promptMessages = [
        `[SYSTEM INSTRUCTION]\n${systemPrompt}`,
        ...chatHistory.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
        `User: ${userQuery}\nAssistant:`
      ].join("\n\n");

      const res = await window.puter.ai.chat(promptMessages, {
        model: "gpt-4o-mini",
      });

      if (typeof res === "string" && res.trim().length > 0) {
        return res.trim();
      }
      if (res?.message?.content && typeof res.message.content === "string") {
        return res.message.content.trim();
      }
      if (res?.text && typeof res.text === "string") {
        return res.text.trim();
      }
      // If object with text
      const stringified = JSON.stringify(res);
      if (stringified.length > 5 && !stringified.includes("error")) {
        return typeof res === "object" ? (res.content || res.text || res.message || stringified) : stringified;
      }
    } catch (err: any) {
      console.warn("Puter.ai chat failed or rate-limited. Falling back to local analytical engine:", err);
    }
  }

  // Graceful Local Analytical Engine fallback if Puter AI is unreachable:
  return generateLocalAnalyticsResponse(userQuery, context);
}

// Local analytical intelligence engine that provides real responses based on the dashboard snapshot
function generateLocalAnalyticsResponse(query: string, context: AiDashboardContext): string {
  const q = query.toLowerCase();

  // 1. Stockout / Out of stock questions
  if (q.includes("stock") || q.includes("sold out") || q.includes("run out") || q.includes("deplet") || q.includes("predict")) {
    if (context.stockoutPredictions.length === 0) {
      return `### 🔮 Stockout Prediction Analysis\n\nAll current inventory lines are currently operating within safe operational buffer thresholds. No imminent stockouts detected in your ${context.role} portal.`;
    }

    const critical = context.stockoutPredictions.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
    const safe = context.stockoutPredictions.filter(p => p.riskLevel !== 'CRITICAL' && p.riskLevel !== 'HIGH');

    let out = `### 🔮 Stockout Risk & Depletion Predictions\n\n`;
    if (critical.length > 0) {
      out += `⚠️ **High Risk Items (${critical.length} Medicines):**\n`;
      critical.forEach(c => {
        out += `- **${c.medicineName}** (${c.batchNumber}): **${c.currentQuantity} units remaining** · *Risk: ${c.riskLevel}* · Depletion in: **${c.daysUntilStockout}**.\n  → *Recommendation*: ${c.recommendation}\n`;
      });
    } else {
      out += `✅ No items are currently at critical stockout risk.\n\n`;
    }

    if (safe.length > 0) {
      out += `\n📦 **Adequate Stock Buffer (${safe.length} Medicines):**\n`;
      safe.slice(0, 3).forEach(s => {
        out += `- **${s.medicineName}**: ${s.currentQuantity} units in stock (${s.daysUntilStockout}).\n`;
      });
    }
    return out;
  }

  // 2. Reorder recommendations
  if (q.includes("reorder") || q.includes("order") || q.includes("recommend") || q.includes("buy") || q.includes("purchase")) {
    if (context.reorderRecommendations.length === 0) {
      return `### 💡 Drug Reorder Recommendations\n\nYour current stock across all catalog lines is above minimum safety reorder thresholds. No emergency procurement orders are required today.`;
    }

    let out = `### 💡 Recommended Drug Procurement Orders\n\nBased on your live stock levels and consumption velocity, here is your prioritized reorder list:\n\n`;
    context.reorderRecommendations.forEach((r, idx) => {
      out += `${idx + 1}. **${r.medicineName}**\n`;
      out += `   - **Current Stock**: ${r.currentQuantity} units remaining\n`;
      out += `   - **Suggested Reorder**: **${r.suggestedOrderQuantity} units**\n`;
      out += `   - **Urgency**: \`${r.urgency}\`\n`;
      out += `   - **Source**: Order from ${r.supplierRole}\n`;
      out += `   - **Rationale**: ${r.reason}\n\n`;
    });
    return out;
  }

  // 3. Expiry analysis
  if (q.includes("expiry") || q.includes("expire") || q.includes("near") || q.includes("date")) {
    if (context.nearExpiryRisks.length === 0) {
      return `### ⚠️ Expiry Risk Radar\n\n✅ Great news! None of the batches currently in your ${context.role} inventory are within the 60-day near-expiry threshold. All batches have healthy shelf-life buffers.`;
    }

    let out = `### ⚠️ Near-Expiry Risk Analysis (${context.nearExpiryRisks.length} Batches Flagged)\n\n`;
    context.nearExpiryRisks.forEach(e => {
      out += `- **${e.medicineName}** (Batch: \`${e.batchNumber}\`)\n`;
      out += `  - **Stock at Risk**: ${e.quantity} units\n`;
      out += `  - **Days to Expiry**: **${e.daysToExpiry} days** (Exp: ${e.expiryDate})\n`;
      out += `  - **Action**: ${e.suggestedAction}\n\n`;
    });
    return out;
  }

  // 4. Sales and movement summary
  if (q.includes("sale") || q.includes("summary") || q.includes("perform") || q.includes("overview") || q.includes("dashboard") || q.includes("data")) {
    let out = `### 📊 Dashboard Operations & Velocity Summary\n\n`;
    out += `**Role**: ${context.role.toUpperCase()} (${context.userName})\n\n`;
    out += `**Live Status**:\n${context.summary}\n\n`;
    out += `**Key Performance Indicators**:\n`;
    Object.entries(context.metrics).forEach(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      out += `- **${label}**: ${typeof v === 'number' ? v.toLocaleString() : v}\n`;
    });

    if (context.stockoutPredictions.length > 0) {
      const crit = context.stockoutPredictions.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
      if (crit.length > 0) {
        out += `\n⚠️ **Urgent Attention**: ${crit.length} medicine(s) are at critical low stock thresholds and require immediate reorder.`;
      }
    }

    return out;
  }

  // General fallback
  return `### 🤖 PharmaTrack AI Assistant (${context.role.toUpperCase()})\n\nI am analyzing your live dashboard data. Here is what I can help you with:\n\n` +
    `- 📊 **Sales & Movement Summary**: Ask for an operational breakdown of your stock and deliveries.\n` +
    `- 🔮 **Stockout Predictions**: Ask *"Which medicines are going to sell out first?"*\n` +
    `- 💡 **Drug Reorder Recommendations**: Ask *"What medicines should I order from the supplier?"*\n` +
    `- ⚠️ **Near-Expiry Risk Audit**: Ask *"Are any of my batches near expiry?"*\n\n` +
    `*All insights are calculated exclusively from your authenticated dashboard records.*`;
}
