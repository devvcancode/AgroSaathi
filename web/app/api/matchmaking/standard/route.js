import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req) {
  try {
    const { farmerProfile, buyerRequirements } = await req.json()
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    const prompt = `
    You are an expert agricultural logistics AI for AgroVani. Your goal is to match farmers who have crop residue (stubble) with buyers who need it (e.g., biomass plants, custom hiring centers).

    Analyze the following profiles and provide a JSON response indicating the compatibility score (0-100), reasoning, and logistical recommendations.
    
    Farmer Profile:
    ${JSON.stringify(farmerProfile, null, 2)}
    
    Buyer Requirements:
    ${JSON.stringify(buyerRequirements, null, 2)}

    Respond strictly in JSON format:
    {
      "matchScore": number,
      "reasoning": "string",
      "logisticsRecommendation": "string"
    }
    `

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    })

    const resultText = response.text
    return NextResponse.json(JSON.parse(resultText))
    
  } catch (error) {
    console.error('Matchmaking error:', error)
    return NextResponse.json({ error: 'Failed to process matchmaking request.' }, { status: 500 })
  }
}
