import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const { stadiumState } = await req.json();

    const prompt = `
      Act as "FlowMind AI", a predictive crowd autopilot for an Olympic Stadium.
      
      Current Stadium Context:
      - Phase: ${stadiumState.phase}
      - Event Time: ${stadiumState.time} mins
      - Zone Metadata: ${JSON.stringify(stadiumState.zones)}
      
      Task:
      Direct crowd movement to optimize flow. 
      Analyze the current zone counts. Predict where bottlenecks will be in 5 minutes based on the phase (e.g. halftime means food stall congestion; post-game means gate congestion).
      
      Output 3 specific movement decisions in this exact JSON format:
      {
        "decisions": [
          {"id": 1, "action": "MOVE", "from": "Section 101", "to": "Gate C", "reason": "Gate A predicted 15m delay in 5 mins", "urgency": "high"},
          {"id": 2, "action": "WAIT", "from": "Section 104", "to": "Stall 2", "reason": "Halftime surge starting; wait 4 mins for line drop", "urgency": "medium"},
          {"id": 3, "action": "PATH", "from": "Gate B", "to": "Stall 1", "reason": "Gate B is clear but Concourse B is filling; use Route 4", "urgency": "low"}
        ],
        "predicted_hotspots": ["Gate A", "Stall 3"]
      }
    `;

    // Only hit real API if key exists, otherwise mock to keep demo moving
    if (!process.env.GOOGLE_API_KEY) {
      console.warn("GOOGLE_API_KEY missing, using mock response");
      return NextResponse.json({
        decisions: [
          {id: 1, action: "MOVE", from: "North Stand", to: "Gate C", reason: "Gate A predicted 20m stall in 5 mins", urgency: "high"},
          {id: 2, action: "WAIT", from: "South Stand", to: "Stall 2", reason: "Halftime surge starting; queue drops in 4 mins", urgency: "medium"},
          {id: 3, action: "PATH", from: "Gate B", to: "Stall 1", reason: "Standard path congested; try route C", urgency: "low"}
        ],
        predicted_hotspots: ["Gate A", "Food Area North"]
      });
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean JSON if model adds markdown blocks
    const cleanedText = text.replace(/```json|```/g, "");
    const data = JSON.parse(cleanedText);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Brain offline" }, { status: 500 });
  }
}
