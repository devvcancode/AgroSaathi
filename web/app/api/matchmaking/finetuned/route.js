import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'

export async function POST(req) {
  try {
    const { farmerProfile, buyerRequirements } = await req.json()
    
    const projectId = process.env.VERTEX_AI_PROJECT_ID
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1'
    const endpointId = process.env.VERTEX_AI_ENDPOINT_ID // The ID of the fine-tuned model endpoint

    if (!projectId || !endpointId) {
      return NextResponse.json({ error: 'Vertex AI Project ID and Endpoint ID must be configured.' }, { status: 500 })
    }

    // Initialize Vertex AI with the custom fine-tuned endpoint
    const vertexAI = new VertexAI({ project: projectId, location: location })
    const generativeModel = vertexAI.getGenerativeModel({
      model: endpointId,
      generationConfig: {
        responseMimeType: 'application/json',
      }
    })
    
    const prompt = `
    Analyze the following profiles using historical transaction and seasonal context. Provide a JSON response indicating the compatibility score (0-100), detailed reasoning, and advanced logistical recommendations.
    
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

    const response = await generativeModel.generateContent(prompt)

    if (response.response.candidates && response.response.candidates.length > 0) {
      const resultText = response.response.candidates[0].content.parts[0].text
      return NextResponse.json(JSON.parse(resultText))
    } else {
       throw new Error('No candidates returned from Vertex AI model')
    }
    
  } catch (error) {
    console.error('Fine-tuned Matchmaking error:', error)
    return NextResponse.json({ error: 'Failed to process advanced matchmaking request.' }, { status: 500 })
  }
}
