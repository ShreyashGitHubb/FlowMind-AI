import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const { stadiumState, role = "fan" } = await req.json();

    const prompt = `
      Act as "FlowMind AI", a predictive crowd autopilot for an Olympic Stadium.
      Current Role: ${role}
      
      Current Stadium Context:
      - Phase: ${stadiumState.phase}
      - Event Time: ${stadiumState.time} mins
      - Zone Metadata: ${JSON.stringify(stadiumState.zones)}
      
      Task:
      ${role === 'organizer' 
        ? 'Analyze congestion. Suggest STAFF DEPLOYMENTS (where to move staff to help fans).' 
        : 'Direct individual crowd movement to optimize flow. Predict bottlenecks in 5 mins.'}
      
      Output 3 specific movement decisions in this exact JSON format:
      {
        "decisions": [
          {"id": 1, "action": "${role === 'organizer' ? 'DEPLOY' : 'MOVE'}", "from": "zone-id", "to": "zone-id", "reason": "why", "urgency": "high"}
        ],
        "predicted_hotspots": ["Zone Name"]
      }
    `;

    // Only hit real API if key exists
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        decisions: [
          {id: 1, action: role === 'organizer' ? "DEPLOY" : "MOVE", from: "North Stand", to: "Gate C", reason: "Predicted 20m stall in 5 mins", urgency: "high"},
          {id: 2, action: "WAIT", from: "South Stand", to: "Stall 2", reason: "Halftime surge starting", urgency: "medium"},
          {id: 3, action: "PATH", from: "Gate B", to: "Stall 1", reason: "Try route C", urgency: "low"}
        ],
        predicted_hotspots: ["Gate A", "Stall 3"]
      });
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const data = JSON.parse(text.replace(/```json|```/g, ""));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Brain offline" }, { status: 500 });
  }
}

