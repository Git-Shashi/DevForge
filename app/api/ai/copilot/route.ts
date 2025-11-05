import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, context, language, fileName, action, projectContext, projectId, fileContent, selectedText } = await req.json();

    if (!prompt && action !== 'chat') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        message: 'Please add GEMINI_API_KEY to your .env.local file'
      }, { status: 500 });
    }

    // Build the context-aware prompt
    const systemPrompt = buildSystemPrompt(action, language, fileName, projectContext);
    const fullPrompt = buildFullPrompt(systemPrompt, prompt, context || fileContent || selectedText);

    console.log('🤖 AI Copilot request:', { action, language, fileName, promptLength: prompt?.length || 0, hasProjectContext: !!projectContext });

    // Call Gemini API with the correct model (gemini-2.0-flash)
    console.log('Calling Gemini API with model: gemini-2.0-flash');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return NextResponse.json({ 
        error: 'Failed to generate suggestion',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('✅ AI suggestion generated:', { length: suggestion.length });

    return NextResponse.json({ 
      suggestion,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('AI Copilot error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(action: string, language: string, fileName: string, projectContext?: string): string {
  const basePrompt = `You are an expert coding assistant with access to the entire project codebase.
Language: ${language || 'Unknown'}
File: ${fileName || 'Untitled'}
${projectContext ? `\nProject Structure:\n${projectContext}\n` : ''}

`;

  switch (action) {
    case 'chat':
      return basePrompt + `You are a conversational AI assistant that helps developers with their code.
- Answer questions about the codebase
- Suggest implementations for new features
- Help debug issues
- Provide code examples when helpful
- Reference specific files from the project when relevant
- Be conversational but precise`;

    case 'complete':
      return basePrompt + `Generate code completion that naturally continues from the current cursor position.
- Provide only the completion code, no explanations
- Match the existing code style and indentation
- Be concise and relevant`;

    case 'explain':
      return basePrompt + `Explain the selected code clearly and concisely.
- Use simple language
- Highlight key concepts
- Provide practical insights`;

    case 'fix':
      return basePrompt + `Analyze the code and suggest fixes for bugs or improvements.
- Identify potential issues
- Provide corrected code
- Explain what was wrong`;

    case 'refactor':
      return basePrompt + `Suggest refactoring improvements for the code.
- Improve readability
- Enhance performance
- Follow best practices
- Maintain functionality`;

    case 'comment':
      return basePrompt + `Add helpful comments to the code.
- Explain what the code does
- Document parameters and return values
- Use appropriate comment style for ${language}`;

    case 'test':
      return basePrompt + `Generate unit tests for the code.
- Cover main functionality
- Include edge cases
- Use appropriate testing framework for ${language}`;

    default:
      return basePrompt + `Help with the code based on the user's request.`;
  }
}

function buildFullPrompt(systemPrompt: string, userPrompt: string, context?: string): string {
  let prompt = systemPrompt + '\n\n';

  if (context) {
    prompt += `Current code context:\n\`\`\`\n${context}\n\`\`\`\n\n`;
  }

  prompt += `User request: ${userPrompt}\n\n`;
  prompt += `Provide your response. If generating code, wrap it in markdown code blocks with the appropriate language.`;

  return prompt;
}
