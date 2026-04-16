import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { stadiumState, role = "fan", image } = await req.json();

    let promptParts: any[] = [
      `
      Act as "FlowMind AI", a predictive crowd autopilot for an Olympic Stadium.
      Current Role: ${role}
      
      Current Stadium Context:
      - Phase: ${stadiumState.phase}
      - Event Time: ${stadiumState.time} mins
      - Zone Metadata: ${JSON.stringify(stadiumState.zones)}
      
      Task:
      ${image ? 'ANALYZE THE ATTACHED CCTV IMAGE. Compare visual density to reported sensor data.' : ''}
      ${role === 'organizer' 
        ? 'Analyze congestion. Suggest STAFF DEPLOYMENTS (where to move staff to help fans).' 
        : 'Direct individual crowd movement to optimize flow. Predict bottlenecks in 5 mins.'}
      
      Output 3 specific movement decisions in this exact JSON format:
      {
        "decisions": [
          {"id": number, "action": "${role === 'organizer' ? 'DEPLOY' : 'MOVE'}", "from": "zone-id", "to": "zone-id", "reason": "why", "urgency": "high"}
        ],
        "visual_analysis": "short observation of the camera feed if provided",
        "predicted_hotspots": ["Zone Name"]
      }
      `
    ];

    if (image) {
      promptParts.push({
        inlineData: {
          data: image,
          mimeType: "image/jpeg"
        }
      });
    }

    // Only hit real API if key exists
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        decisions: [
          {id: 1, action: role === 'organizer' ? "DEPLOY" : "MOVE", from: "North Stand", to: "Gate C", reason: "Visual analysis confirms surge", urgency: "high"},
          {id: 2, action: "WAIT", from: "South Stand", to: "Stall 2", reason: "Crowd density increasing", urgency: "medium"},
          {id: 3, action: "PATH", from: "Gate B", to: "Stall 1", reason: "Standard path congested", urgency: "low"}
        ],
        visual_analysis: image ? "Visual inspection confirms high density at main concourse." : null,
        predicted_hotspots: ["Gate A", "Stall 3"]
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(promptParts);
    const text = result.response.text().trim();
    const data = JSON.parse(text.replace(/```json|```/g, ""));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Brain offline" }, { status: 500 });
  }
}


