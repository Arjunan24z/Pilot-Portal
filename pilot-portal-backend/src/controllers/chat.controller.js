const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Medical = require("../models/medicals.model");
const License = require("../models/license.model");
const User = require("../models/user.model");
const Logbook = require("../models/logbook.model");
const currencyService = require("../services/currency.service");

// TRUE AI: Using Groq's FREE API with Llama models
// Sign up at https://console.groq.com for FREE API key
// OR use OpenRouter's free tier: https://openrouter.ai/

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_FREE_GROQ_API_KEY_HERE";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Alternative: OpenRouter (supports many free models)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Fallback models (these are more reliable than Hugging Face inference)
const AI_MODELS = [
  {
    name: "Groq-Llama-3.1-8B",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    apiKey: GROQ_API_KEY,
    url: GROQ_API_URL
  },
  {
    name: "OpenRouter-Llama-3.2-3B-Free",
    provider: "openrouter", 
    model: "meta-llama/llama-3.2-3b-instruct:free",
    apiKey: OPENROUTER_API_KEY,
    url: OPENROUTER_API_URL
  }
];

// Read and analyze actual project files
function analyzeProjectCode() {
  // Inside Docker, paths are different - we're in /app
  const projectRoot = "/app";  // Backend is in /app
  const frontendRoot = "/app/../frontend"; // Try to access frontend if mounted
  
  const codeAnalysis = {
    files: {},
    structure: ""
  };

  try {
    // Read key files from YOUR actual codebase (adjust paths for Docker)
    const filesToRead = [
      { path: path.join(projectRoot, "package.json"), name: "backend/package.json" },
      { path: path.join(projectRoot, "src/app.js"), name: "backend/src/app.js" },
      { path: path.join(projectRoot, "src/models/user.model.js"), name: "backend/src/models/user.model.js" },
      { path: path.join(projectRoot, "src/models/logbook.model.js"), name: "backend/src/models/logbook.model.js" },
      { path: path.join(projectRoot, "src/models/license.model.js"), name: "backend/src/models/license.model.js" },
      { path: path.join(projectRoot, "src/models/medicals.model.js"), name: "backend/src/models/medicals.model.js" },
      { path: path.join(projectRoot, "src/controllers/auth.controller.js"), name: "backend/src/controllers/auth.controller.js" },
      { path: path.join(projectRoot, "src/routes/chat.routes.js"), name: "backend/src/routes/chat.routes.js" }
    ];

    filesToRead.forEach(({ path: filePath, name }) => {
      try {
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, "utf-8");
          // Truncate if too large
          if (content.length > 1500) {
            content = content.substring(0, 1500) + "\n... (truncated for brevity)";
          }
          codeAnalysis.files[name] = content;
          console.log(`[CHAT] ✓ Read file: ${name} (${content.length} bytes)`);
        } else {
          console.log(`[CHAT] ✗ File not found: ${filePath}`);
        }
      } catch (err) {
        console.error(`[CHAT] Error reading ${filePath}:`, err.message);
      }
    });

    // Scan directory structure
    codeAnalysis.structure = scanProjectStructure(projectRoot);

  } catch (error) {
    console.error("[CHAT] Error reading project files:", error.message);
  }

  return codeAnalysis;
}

// Scan project directory structure
function scanProjectStructure(dir, depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return "";
  
  let structure = "";
  try {
    const items = fs.readdirSync(dir);
    const indent = "  ".repeat(depth);
    
    items.forEach(item => {
      // Skip hidden, node_modules, dist
      if (item.startsWith(".") || item === "node_modules" || item === "dist" || item === "uploads") return;
      
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        structure += `${indent}📁 ${item}/\n`;
        structure += scanProjectStructure(itemPath, depth + 1, maxDepth);
      } else if (item.endsWith(".js") || item.endsWith(".ts") || item.endsWith(".json") || item.endsWith(".yml")) {
        structure += `${indent}📄 ${item}\n`;
      }
    });
  } catch (error) {
    // Skip inaccessible directories
  }
  
  return structure;
}

// Fetch user's personal data (medicals, licenses, logbook, currency)
async function fetchUserData(userId) {
  try {
    const userData = {
      medicals: [],
      licenses: [],
      logbook: [],
      flightHours: {},
      currency: {},
      summary: ""
    };

    // Fetch user medicals
    const medicals = await Medical.find({ userId }).sort({ expiryDate: 1 });
    userData.medicals = medicals.map(m => ({
      type: m.classType,
      issueDate: m.issueDate,
      expiryDate: m.expiryDate,
      status: m.expiryDate ? (new Date(m.expiryDate) > new Date() ? 'Valid' : 'Expired') : 'Unknown',
      daysUntilExpiry: m.expiryDate ? Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      remarks: m.remarks
    }));

    // Fetch user licenses
    const licenses = await License.find({ userId }).sort({ expiryDate: 1 });
    userData.licenses = licenses.map(l => ({
      type: l.type,
      licenseNumber: l.licenseNumber,
      issueDate: l.issueDate,
      expiryDate: l.expiryDate,
      status: l.expiryDate ? (new Date(l.expiryDate) > new Date() ? 'Valid' : 'Expired') : 'Unknown',
      daysUntilExpiry: l.expiryDate ? Math.ceil((new Date(l.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      remarks: l.remarks
    }));

    // Fetch logbook data
    const logbookEntries = await Logbook.find({ userId }).sort({ date: -1 }).limit(10);
    userData.logbook = logbookEntries.map(entry => ({
      date: entry.date,
      aircraft: entry.aircraft,
      from: entry.departureAirport,
      to: entry.arrivalAirport,
      totalTime: entry.totalTime,
      pic: entry.pilotInCommand,
      night: entry.nightTime,
      crossCountry: entry.crossCountry,
      remarks: entry.remarks
    }));

    // Calculate flight hours totals
    const allEntries = await Logbook.find({ userId });
    userData.flightHours = {
      totalTime: allEntries.reduce((sum, e) => sum + (e.totalTime || 0), 0),
      pic: allEntries.reduce((sum, e) => sum + (e.pilotInCommand || 0), 0),
      dualReceived: allEntries.reduce((sum, e) => sum + (e.dualReceived || 0), 0),
      solo: allEntries.reduce((sum, e) => sum + (e.soloTime || 0), 0),
      night: allEntries.reduce((sum, e) => sum + (e.nightTime || 0), 0),
      crossCountry: allEntries.reduce((sum, e) => sum + (e.crossCountry || 0), 0),
      instrument: allEntries.reduce((sum, e) => sum + (e.instrumentActual || 0) + (e.instrumentSimulated || 0), 0),
      totalFlights: allEntries.length
    };

    // Get currency status
    try {
      userData.currency = await currencyService.getCurrencyStatus(userId);
    } catch (err) {
      console.error("Error fetching currency:", err);
      userData.currency = { error: "Could not calculate currency" };
    }

    // Generate comprehensive summary
    let summary = "\n=== YOUR PILOT DATA SUMMARY ===\n\n";
    
    // Flight Hours Summary
    summary += "✈️ FLIGHT HOURS:\n";
    summary += `  • Total Time: ${userData.flightHours.totalTime?.toFixed(1) || 0} hours\n`;
    summary += `  • Pilot in Command (PIC): ${userData.flightHours.pic?.toFixed(1) || 0} hours\n`;
    summary += `  • Dual Received: ${userData.flightHours.dualReceived?.toFixed(1) || 0} hours\n`;
    summary += `  • Solo: ${userData.flightHours.solo?.toFixed(1) || 0} hours\n`;
    summary += `  • Night: ${userData.flightHours.night?.toFixed(1) || 0} hours\n`;
    summary += `  • Cross-Country: ${userData.flightHours.crossCountry?.toFixed(1) || 0} hours\n`;
    summary += `  • Instrument: ${userData.flightHours.instrument?.toFixed(1) || 0} hours\n`;
    summary += `  • Total Flights: ${userData.flightHours.totalFlights || 0}\n`;

    // Currency Status
    summary += "\n🕒 CURRENCY STATUS:\n";
    if (userData.currency && userData.currency.passengerCurrency) {
      const passCurr = userData.currency.passengerCurrency;
      summary += `  • Passenger Currency: ${passCurr.isCurrent ? '✅ Current' : '❌ Not Current'}\n`;
      if (passCurr.isCurrent && passCurr.daysRemaining !== null) {
        summary += `    - Valid for ${passCurr.daysRemaining} more days\n`;
      }
      
      const nightCurr = userData.currency.nightCurrency;
      summary += `  • Night Passenger Currency: ${nightCurr.isCurrent ? '✅ Current' : '❌ Not Current'}\n`;
      if (nightCurr.isCurrent && nightCurr.daysRemaining !== null) {
        summary += `    - Valid for ${nightCurr.daysRemaining} more days\n`;
      }
      
      const instCurr = userData.currency.instrumentCurrency;
      summary += `  • Instrument Currency: ${instCurr.isCurrent ? '✅ Current' : '❌ Not Current'}\n`;
      if (instCurr.isCurrent && instCurr.daysRemaining !== null) {
        summary += `    - Valid for ${instCurr.daysRemaining} more days\n`;
      }
      
      summary += `  • Overall Flight Ready: ${userData.currency.isFlightReady ? '✅ YES' : '❌ NO'}\n`;
    }
    
    // Medical summary
    summary += "\n📋 MEDICAL CERTIFICATES:\n";
    if (medicals.length === 0) {
      summary += "  • No medical certificates uploaded yet\n";
    } else {
      medicals.forEach(m => {
        const status = m.expiryDate ? (new Date(m.expiryDate) > new Date() ? '✅ Valid' : '❌ Expired') : '⚠️ No expiry date';
        const daysLeft = m.expiryDate ? Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const expiryInfo = m.expiryDate ? `Expires: ${new Date(m.expiryDate).toLocaleDateString()}` : 'No expiry date set';
        const daysInfo = daysLeft !== null ? (daysLeft > 0 ? ` (${daysLeft} days left)` : ` (expired ${Math.abs(daysLeft)} days ago)`) : '';
        summary += `  • ${m.classType}: ${status} - ${expiryInfo}${daysInfo}\n`;
      });
    }
    
    // License summary
    summary += "\n📜 LICENSES:\n";
    if (licenses.length === 0) {
      summary += "  • No licenses uploaded yet\n";
    } else {
      licenses.forEach(l => {
        const status = l.expiryDate ? (new Date(l.expiryDate) > new Date() ? '✅ Valid' : '❌ Expired') : '⚠️ No expiry date';
        const daysLeft = l.expiryDate ? Math.ceil((new Date(l.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const expiryInfo = l.expiryDate ? `Expires: ${new Date(l.expiryDate).toLocaleDateString()}` : 'No expiry date set';
        const daysInfo = daysLeft !== null ? (daysLeft > 0 ? ` (${daysLeft} days left)` : ` (expired ${Math.abs(daysLeft)} days ago)`) : '';
        const licenseNum = l.licenseNumber ? ` #${l.licenseNumber}` : '';
        summary += `  • ${l.type}${licenseNum}: ${status} - ${expiryInfo}${daysInfo}\n`;
      });
    }
    
    // Recent Flights
    summary += "\n🛫 RECENT FLIGHTS (Last 10):\n";
    if (logbookEntries.length === 0) {
      summary += "  • No flights logged yet\n";
    } else {
      logbookEntries.slice(0, 5).forEach((entry, idx) => {
        const dateStr = new Date(entry.date).toLocaleDateString();
        const route = entry.departureAirport && entry.arrivalAirport ? `${entry.departureAirport} → ${entry.arrivalAirport}` : 'N/A';
        const aircraft = entry.aircraft || 'N/A';
        const time = entry.totalTime ? `${entry.totalTime.toFixed(1)}h` : 'N/A';
        summary += `  ${idx + 1}. ${dateStr}: ${aircraft} (${route}) - ${time}\n`;
      });
    }

    // Warnings for expiring items
    const expiringMedicals = medicals.filter(m => m.expiryDate && Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30 && new Date(m.expiryDate) > new Date());
    const expiringLicenses = licenses.filter(l => l.expiryDate && Math.ceil((new Date(l.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30 && new Date(l.expiryDate) > new Date());
    
    if (expiringMedicals.length > 0 || expiringLicenses.length > 0) {
      summary += "\n⚠️ EXPIRING SOON (within 30 days):\n";
      expiringMedicals.forEach(m => {
        const daysLeft = Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        summary += `  • ${m.classType} Medical - ${daysLeft} days left\n`;
      });
      expiringLicenses.forEach(l => {
        const daysLeft = Math.ceil((new Date(l.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        summary += `  • ${l.type} License - ${daysLeft} days left\n`;
      });
    }

    summary += "\n================================\n";
    userData.summary = summary;

    return userData;
  } catch (error) {
    console.error("[CHAT] Error fetching user data:", error.message);
    return {
      medicals: [],
      licenses: [],
      summary: "\n⚠️ Unable to fetch your personal data at this time.\n"
    };
  }
}

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id; // Assuming auth middleware sets req.user

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    console.log(`\n[CHAT] 🤖 User Question: "${message}"`);
    console.log("[CHAT] 📂 Reading actual project source code...");

    // STEP 1: Read and analyze YOUR actual project files
    const projectCode = analyzeProjectCode();
    
    console.log(`[CHAT] ✓ Analyzed ${Object.keys(projectCode.files).length} files from your codebase`);

    // STEP 1.5: Fetch user's personal data
    let userData = { summary: "", medicals: [], licenses: [] };
    if (userId) {
      console.log("[CHAT] 📊 Fetching your personal data (medicals, licenses)...");
      userData = await fetchUserData(userId);
      console.log("[CHAT] ✓ Personal data loaded");
    }

    // STEP 2: Build enhanced prompt with user data for AI
    const aiPrompt = `You are an intelligent Pilot Assistant AI for a real-time pilot logbook application. You have access to the user's actual flight data and can answer both aviation-related questions AND questions about the application itself.

${userData.summary}

USER QUESTION: ${message}

IMPORTANT INSTRUCTIONS:

**For Personal Data Questions (flight hours, currency, medicals, licenses):**
1. Answer directly from the user data summary above - it contains their current status
2. Be specific with numbers and dates from their data
3. If they ask about currency, reference the exact status from the summary
4. If they ask about expiring items, tell them exactly how many days remain
5. If they're not current or something is expired, suggest specific actions to regain currency

**For Aviation Knowledge Questions:**
6. Provide accurate FAA regulatory information (14 CFR)
7. Explain requirements for ratings, certificates, and currency
8. Help with flight planning calculations
9. Explain aviation weather, airspace, or operations questions
10. Reference specific regulations when applicable

**For Application Questions:**
11. Explain how to use features in simple terms
12. Guide users through workflows step-by-step
13. Explain what data is tracked and why it matters

**Examples of Good Responses:**

Q: "Am I current to carry passengers?"
A: "Based on your logbook, you are ✅ CURRENT for passenger operations! You have completed 3 takeoffs and landings in the last 90 days. Your passenger currency is valid for another 45 days. Keep flying to maintain your currency!"

Q: "How many hours do I have?"
A: "You have a total of 10.3 flight hours logged, including:
• 5.8 hours as Pilot in Command (PIC)
• 5.5 hours of dual instruction  
• 1.2 hours of night flying
• 4.6 hours cross-country
You're making great progress toward your license requirements!"

Q: "When does my medical expire?"
A: "Your Class 1 Medical Certificate expires on 12/31/2026 - that's 339 days from now. You're in good shape! You'll want to schedule your renewal appointment about 30 days before expiration."

Q: "What do I need for my private pilot license?"
A: "According to FAA regulations (14 CFR Part 61.109), you need:
• At least 40 hours total flight time (you have 10.3 - keep going!)
• 20 hours minimum with instructor
• 10 hours minimum solo flight
• 3 hours cross-country
• 3 hours night flight (including 10 takeoffs/landings)
• 3 hours instrument training
• One 150+ nautical mile cross-country solo
You're on track! Focus on building your solo and cross-country hours next."

**Aviation Knowledge Base:**
- VFR Passenger Currency: 3 takeoffs/landings in preceding 90 days
- Night Passenger Currency: 3 night takeoffs/landings (to full stop) in preceding 90 days
- IFR Currency: 6 approaches + holding + intercepting/tracking in preceding 6 months
- Class 1 Medical: 12 months (under 40), 6 months (over 40) for ATP/commercial
- Class 2 Medical: 12 months for commercial operations
- Class 3 Medical: 60 months (under 40), 24 months (over 40) for private
- PPL Requirements: 40 hours minimum (20 dual, 10 solo, 3 XC, 3 night, 3 instrument)
- CPL Requirements: 250 hours minimum (100 PIC, 50 XC, 10 complex, etc.)
- Cross-Country Definition: Flight >50nm from departure point

Now answer the user's question using their actual data and aviation knowledge. Be friendly, accurate, and helpful:`;

    console.log(`[CHAT] 📝 Prompt prepared with real code (${aiPrompt.length} characters)`);
    console.log("[CHAT] 🚀 Sending to AI for dynamic analysis...");

    let answer = null;
    let modelUsed = null;

    // STEP 3: Send REAL CODE to TRUE AI for intelligent analysis
    for (const model of AI_MODELS) {
      try {
        console.log(`[CHAT]   → Calling ${model.name}...`);
        
        // Check if API key is configured
        if (!model.apiKey || model.apiKey.includes("YOUR_FREE") || model.apiKey === "") {
          console.log(`[CHAT]   ⚠️  ${model.provider} API key not configured - skipping`);
          continue;
        }

        // OpenAI-compatible chat completion format
        const response = await axios.post(
          model.url,
          {
            model: model.model,
            messages: [
              {
                role: "system",
                content: "You are a friendly assistant helping pilots manage their Pilot Portal. You can answer questions about their personal data (medicals, licenses, expiry dates) AND explain how the application works. When asked about personal data, provide clear, direct answers from the data summary. When explaining how things work, use simple language without technical jargon. Always prioritize answering the user's specific question first, then provide additional helpful context if needed."
              },
              {
                role: "user",
                content: aiPrompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${model.apiKey}`,
              ...(model.provider === "openrouter" && {
                "HTTP-Referer": "http://localhost:4200",
                "X-Title": "Pilot Portal"
              })
            },
            timeout: 35000
          }
        );

        if (response.data?.choices?.[0]?.message?.content) {
          const aiText = response.data.choices[0].message.content.trim();
          
          if (aiText.length > 60) {
            answer = aiText;
            modelUsed = `${model.name} (TRUE AI Code Analysis)`;
            console.log(`[CHAT] ✅ ${model.name} generated intelligent response (${aiText.length} chars)`);
            break;
          }
        }
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.log(`[CHAT]   ✗ ${model.name} failed: ${errorMsg}`);
      }
    }

    // STEP 4: If no API keys configured, show code with explanation
    if (!answer) {
      console.log("[CHAT] ⚠️  No AI APIs configured - showing code with intelligent explanation");
      answer = generateIntelligentCodeResponse(message, projectCode, userData);
      modelUsed = "Code Analysis (No AI API configured - Please add GROQ_API_KEY)";
    }

    console.log(`[CHAT] ✓ Response ready from: ${modelUsed}\n`);
    
    res.json({ 
      answer,
      model: modelUsed,
      codeFilesAnalyzed: Object.keys(projectCode.files).length,
      userDataIncluded: userId ? true : false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[CHAT] Critical error:", error);
    res.status(500).json({ 
      message: "Error processing chat",
      error: error.message 
    });
  }
};

// Intelligent code response - shows actual code with smart context
function generateIntelligentCodeResponse(question, projectCode, userData) {
  let response = "";
  
  // If user data available, show it first
  if (userData && userData.summary) {
    response += userData.summary + "\n\n";
  }
  
  response += `**🤖 AI Code Analysis (Configure FREE Groq API for TRUE AI)**\n\n`;
  response += `I analyzed ${Object.keys(projectCode.files).length} real source files from your project:\n\n`;
  
  // Show analyzed files
  response += `**Files Analyzed:**\n${Object.keys(projectCode.files).map(f => `• ${f}`).join("\n")}\n\n`;
  
  // Show relevant code based on question keywords
  const q = question.toLowerCase();
  let relevantCode = [];
  
  // Intelligently select relevant files
  if (q.match(/model|database|schema|collection/)) {
    relevantCode = Object.entries(projectCode.files).filter(([name]) => name.includes("models"));
  } else if (q.match(/auth|login|register|security|jwt/)) {
    relevantCode = Object.entries(projectCode.files).filter(([name]) => name.includes("auth"));
  } else if (q.match(/api|endpoint|route|server/)) {
    relevantCode = Object.entries(projectCode.files).filter(([name]) => name.includes("app.js") || name.includes("routes"));
  } else {
    // Show all code
    relevantCode = Object.entries(projectCode.files).slice(0, 3);
  }
  
  if (relevantCode.length > 0) {
    response += `**Relevant Code:**\n\n`;
    relevantCode.forEach(([filename, code]) => {
      response += `**${filename}**\n\`\`\`javascript\n${code.substring(0, 800)}${code.length > 800 ? "\n..." : ""}\n\`\`\`\n\n`;
    });
  }
  
  response += `\n---\n\n**⚡ Get TRUE AI Analysis:**\n`;
  response += `1. Get a FREE Groq API key: https://console.groq.com\n`;
  response += `2. Add to your .env file: \`GROQ_API_KEY=your_key_here\`\n`;
  response += `3. Restart backend: \`docker-compose restart backend\`\n\n`;
  response += `💡 With TRUE AI, I can intelligently analyze your code and answer ANY question about your project!\n`;
  
  return response;
}
