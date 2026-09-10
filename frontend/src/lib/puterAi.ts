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

  return `You are PharmaTrack AI, the specialized pharmaceutical supply chain intelligence copilot built directly into PharmaTrack Pro.
You are assisting ${context.userName} (${context.role.toUpperCase()}).

CRITICAL INSTRUCTIONS & GUARDRAILS:
1. STRICT DATA SCOPE: You must answer questions based ONLY on the user's live dashboard data provided below. If a user asks about anything unrelated to their dashboard, medicines, stock, inventory, sales, shipments, disposal, or pharmaceutical operations (e.g. general trivia, coding, recipes, sports), politely decline and say: "I am your dedicated PharmaTrack Supply Chain Copilot. I can only assist with analysis, sales summaries, stockout predictions, and reorder recommendations for your dashboard data."
2. STRUCTURED & FORMATTED PRESENTATION:
   - Structure every response cleanly with clear section headings using \`### Heading\`.
   - When presenting multiple drugs, batches, or predictions, USE A CLEAN MARKDOWN TABLE (| Medicine | Stock | Burn Rate / Velocity | Depletion ETA | Status |).
   - Use emoji status callouts for clarity: ⚠️ for critical/high risk, 💡 for reorder suggestions, 🔮 for forecasts, 📊 for metrics, ✅ for healthy items.
   - Use concise, executive bullet points with **bold** highlights for quantities and medicine names.
   - Include a dedicated "### 💡 Recommended Actions" section with concrete next steps.
3. SALES & MOVEMENT ANALYSIS: When asked about sales or inventory movement, summarize the metrics with performance tables and bullet points highlighting high-velocity vs slow-moving medicines.
4. STOCKOUT PREDICTIONS: When asked about stockouts or running out of stock, explicitly name the drugs at risk, their current units, burn rate, and days left before depletion based on the data.
5. DRUG REORDER RECOMMENDATIONS: When asked what to order, provide clear actionable recommendations with:
   - Medicine Name & Batch
   - Current Quantity
   - Suggested Reorder Quantity
   - Urgency Level (Immediate / High / Moderate)
   - Supplier to order from (e.g. Distributor or Manufacturer)
6. NEAR-EXPIRY RISK MITIGATION: Warn about any batches expiring within 30-60 days and recommend whether to prioritize sales (FEFO) or initiate return/disposal.
7. TONE: Professional, executive, and highly authoritative. Never mention external vendor names.

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
      return `### 🔮 Stockout Risk & Depletion Analysis

✅ **All Inventory Lines Healthy**: All current active inventory buffers are operating above minimum safety thresholds. No imminent stockouts detected in your ${context.role.toUpperCase()} operations.`;
    }

    const critical = context.stockoutPredictions.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
    const safe = context.stockoutPredictions.filter(p => p.riskLevel !== 'CRITICAL' && p.riskLevel !== 'HIGH');

    let out = `### 🔮 Stockout Risk & Depletion Forecast\n\n`;

    if (critical.length > 0) {
      out += `⚠️ **High Risk Items (${critical.length} Medicines Flagged):**\n\n`;
      out += `| Medicine | Batch | Stock Left | Depletion ETA | Risk Level |\n`;
      out += `| :--- | :--- | :--- | :--- | :--- |\n`;
      critical.forEach(c => {
        out += `| **${c.medicineName}** | \`${c.batchNumber}\` | **${c.currentQuantity} units** | **${c.daysUntilStockout}** | \`${c.riskLevel}\` |\n`;
      });
      out += `\n### 💡 Immediate Action Required\n`;
      critical.forEach(c => {
        out += `→ **${c.medicineName}**: ${c.recommendation}\n`;
      });
    } else {
      out += `✅ **Zero Critical Depletions**: None of your stocked catalog items have breached the critical stockout horizon.\n\n`;
    }

    if (safe.length > 0) {
      out += `\n### 📦 Stable Buffer Stock (${safe.length} Items)\n\n`;
      out += `| Medicine | Available Quantity | Depletion Horizon |\n`;
      out += `| :--- | :--- | :--- |\n`;
      safe.slice(0, 4).forEach(s => {
        out += `| **${s.medicineName}** | ${s.currentQuantity} units | ${s.daysUntilStockout} |\n`;
      });
    }
    return out;
  }

  // 2. Reorder recommendations
  if (q.includes("reorder") || q.includes("order") || q.includes("recommend") || q.includes("buy") || q.includes("purchase")) {
    if (context.reorderRecommendations.length === 0) {
      return `### 💡 Drug Procurement & Reorder Advisory

✅ **Optimal Stock Posture**: Your catalog lines are adequately stocked above safety replenishment limits. No emergency reorders are required at this time.`;
    }

    let out = `### 💡 Recommended Drug Procurement Orders\n\n`;
    out += `Based on real-time consumption velocity and safety stock buffers, here is your prioritized procurement schedule:\n\n`;
    out += `| Medicine | In Stock | Suggested Order | Urgency | Supplier |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- |\n`;
    context.reorderRecommendations.forEach(r => {
      out += `| **${r.medicineName}** | ${r.currentQuantity} units | **${r.suggestedOrderQuantity} units** | \`${r.urgency}\` | ${r.supplierRole} |\n`;
    });

    out += `\n### 📋 Order Rationale & Logistics\n`;
    context.reorderRecommendations.forEach((r, idx) => {
      out += `${idx + 1}. **${r.medicineName}** (Suggested: **${r.suggestedOrderQuantity} units**)\n   - ${r.reason}\n`;
    });

    return out;
  }

  // 3. Expiry analysis
  if (q.includes("expiry") || q.includes("expire") || q.includes("near") || q.includes("date")) {
    if (context.nearExpiryRisks.length === 0) {
      return `### ⚠️ Expiry Risk Audit

✅ **All Batches Fresh & Valid**: No batches in your ${context.role.toUpperCase()} inventory are within the 60-day near-expiry window. Physical inventory satisfies shelf-life compliance standards.`;
    }

    let out = `### ⚠️ Near-Expiry Risk Radar (${context.nearExpiryRisks.length} Batches Flagged)\n\n`;
    out += `The following batches require immediate FEFO rotation or reverse-logistics dispatch:\n\n`;
    out += `| Medicine | Batch No | Units at Risk | Expiry Date | Days Left |\n`;
    out += `| :--- | :--- | :--- | :--- | :--- |\n`;
    context.nearExpiryRisks.forEach(e => {
      out += `| **${e.medicineName}** | \`${e.batchNumber}\` | **${e.quantity} units** | ${e.expiryDate} | **${e.daysToExpiry} days** |\n`;
    });

    out += `\n### 💡 Mandatory Mitigation Protocols\n`;
    context.nearExpiryRisks.forEach(e => {
      out += `→ **${e.medicineName}** (\`${e.batchNumber}\`): ${e.suggestedAction}\n`;
    });

    return out;
  }

  // 4. Sales and movement summary
  if (q.includes("sale") || q.includes("summary") || q.includes("perform") || q.includes("overview") || q.includes("dashboard") || q.includes("data")) {
    let out = `### 📊 ${context.role.toUpperCase()} Operational Summary\n\n`;
    out += `**Stakeholder**: **${context.userName}** | **Ledger Scope**: Authenticated ${context.role.toUpperCase()}\n\n`;
    out += `💡 **Live Operations Status**:\n${context.summary}\n\n`;

    out += `### 📈 Key Operational Indicators\n\n`;
    out += `| Metric Indicator | Recorded Value | Status |\n`;
    out += `| :--- | :--- | :--- |\n`;
    Object.entries(context.metrics).forEach(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const valStr = typeof v === 'number' ? v.toLocaleString() : String(v);
      out += `| ${label} | **${valStr}** | Active |\n`;
    });

    if (context.stockoutPredictions.length > 0) {
      const crit = context.stockoutPredictions.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
      if (crit.length > 0) {
        out += `\n⚠️ **Operational Alert**: **${crit.length} medicine(s)** have dipped below safe replenishment buffers. Consider issuing purchase orders.`;
      }
    }

    return out;
  }

  // General fallback
  return `### ✨ PharmaTrack AI Intelligence Copilot (${context.role.toUpperCase()})

I am actively monitoring your authenticated live dashboard ledger. You can ask for:

- 📊 **Sales & Movement Summary**: *"Summarize my sales, movement, and KPI performance."*
- 🔮 **Stockout Predictions**: *"Which medicines are going to sell out first?"*
- 💡 **Drug Reorder Recommendations**: *"What medicines should I reorder right now and in what quantities?"*
- ⚠️ **Near-Expiry Risk Audit**: *"Are any batches approaching expiration?"*

*All intelligence calculations are grounded strictly in your live database records.*`;
}
