import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = 'sk_c65805307beff374a5409937311fbeb1db49ae86d121f698';

// Popular natural-sounding voice IDs from ElevenLabs
const VOICE_IDS = {
  'rachel': 'VR6AewLTigWG4xSOukaG', // Young female, clear and natural
  'adam': 'pNInz6obpgDQGcFmaJgB',   // Male, deep and warm
  'domi': 'AZnzlk1XvdvUeBnXmlld',   // Young female, expressive
  'bella': 'EXAVITQu4vr4xnSDxMaL',  // Female, soft and pleasant
  'antoni': 'ErXwobaYiN019PkySvjV', // Male, calm and professional
  'elli': 'MF3mGyEYCl7XYWbV9V6O',   // Young female, energetic
  'josh': 'TxGEqnHWrfWFTfGW9XjX',   // Male, friendly and conversational
  'arnold': 'VR6AewLTigWG4xSOukaG', // Male, strong and confident
  'charlotte': 'XB0fDUnXU5powFXDhCwa', // Female, professional
  'matilda': 'XrExE9yKIg1WjnnlVkGX'  // Child-like, playful
} as const;

type VoiceId = keyof typeof VOICE_IDS;

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'rachel', model = 'eleven_turbo_v2', stability = 0.5, similarity_boost = 0.5 } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' }, 
        { status: 400 }
      );
    }

    // Get voice ID
    const voiceId = VOICE_IDS[voice as VoiceId] || VOICE_IDS.rachel;

    console.log('🎤 ElevenLabs TTS request:', { text: text.substring(0, 50), voice, voiceId });

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: model,
        voice_settings: {
          stability: stability,
          similarity_boost: similarity_boost,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', response.status, errorData);
      throw new Error(`ElevenLabs API failed: ${response.status} - ${errorData}`);
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    console.log('✅ ElevenLabs TTS success, audio size:', audioBuffer.byteLength);

    // Return audio as response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('ElevenLabs TTS API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Export available voices for frontend use
export async function GET() {
  return NextResponse.json({
    voices: Object.keys(VOICE_IDS).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      description: getVoiceDescription(key as VoiceId)
    }))
  });
}

function getVoiceDescription(voice: VoiceId): string {
  const descriptions: Record<VoiceId, string> = {
    'rachel': 'Young female, clear and natural',
    'adam': 'Male, deep and warm',
    'domi': 'Young female, expressive',
    'bella': 'Female, soft and pleasant',
    'antoni': 'Male, calm and professional',
    'elli': 'Young female, energetic',
    'josh': 'Male, friendly and conversational',
    'arnold': 'Male, strong and confident',
    'charlotte': 'Female, professional',
    'matilda': 'Child-like, playful'
  };
  return descriptions[voice];
}