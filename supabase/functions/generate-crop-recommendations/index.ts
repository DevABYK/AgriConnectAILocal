import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { soilType, location, previousCrops } = await req.json();
    
    if (!soilType || !location) {
      return new Response(JSON.stringify({ 
        error: 'Soil type and location are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert agricultural AI assistant specializing in African farming. 
You provide crop recommendations based on soil type, location, and farming history.
Your recommendations should be practical, sustainable, and suitable for smallholder farmers.

Always return your response in the following JSON format:
{
  "recommendations": [
    {
      "crop": "crop name",
      "suitability": "high/medium/low",
      "reasoning": "explanation of why this crop is recommended",
      "best_planting_season": "season name",
      "expected_yield": "yield estimate",
      "sustainability_notes": "environmental impact notes"
    }
  ],
  "rotation_schedule": [
    {
      "season": "season name",
      "crops": ["crop1", "crop2"],
      "benefits": "rotation benefits"
    }
  ],
  "sustainability_score": 85,
  "sustainability_notes": "Overall sustainability assessment"
}`;

    const userPrompt = `Please provide crop recommendations for a farmer with the following details:
- Soil Type: ${soilType}
- Location: ${location}
${previousCrops ? `- Previous Crops: ${previousCrops}` : ''}

Consider crop rotation, local climate, market demand, and sustainability.`;

    console.log('Calling Lovable AI Gateway for crop recommendations...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Too many requests. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service requires payment. Please contact support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Try to parse JSON from the AI response
    let parsedResponse;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a fallback response
      parsedResponse = {
        recommendations: [{
          crop: "Mixed farming recommended",
          suitability: "medium",
          reasoning: aiResponse.substring(0, 200),
          best_planting_season: "Depends on location",
          expected_yield: "Variable",
          sustainability_notes: "AI response could not be parsed"
        }],
        rotation_schedule: [],
        sustainability_score: 70,
        sustainability_notes: "Please consult with local agricultural extension officers"
      };
    }

    console.log('Successfully generated crop recommendations');
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-crop-recommendations function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate recommendations' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
