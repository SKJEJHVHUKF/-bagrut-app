import Anthropic from '@anthropic-ai/sdk';

const SUBJECTS: Record<string, {
  name: string;
  buildPrompt: (topic: string) => string;
}> = {
  math: {
    name: 'מתמטיקה',
    buildPrompt: (t) => `אתה מורה למתמטיקה 5 יחידות לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`
  },
  math12: {
    name: 'מתמטיקה יב',
    buildPrompt: (t) => `אתה מורה למתמטיקה בכיתה יב לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}. השאלות יהיו למתמטיקה רמה גבוהה (5 יחידות).`
  },
  physics: {
    name: 'פיזיקה',
    buildPrompt: (t) => `אתה מורה לפיזיקה 5 יחידות לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`
  },
  english: {
    name: 'אנגלית',
    buildPrompt: (t) => `You are an English Bagrut teacher (5 units) for Israeli students. Create 5 Bagrut-level questions about: ${t}. Questions and answers in English.`
  },
  history: {
    name: 'היסטוריה',
    buildPrompt: (t) => `אתה מורה להיסטוריה לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`
  },
  bible: {
    name: 'תנ"ך',
    buildPrompt: (t) => `אתה מורה לתנ"ך לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}. כלול שאלות על פסוקים, עלילה ומסרים.`
  },
  chem: {
    name: 'כימיה',
    buildPrompt: (t) => `אתה מורה לכימיה 5 יחידות לבגרות בישראל. צור 5 שאלות בגרות ברמה אמיתית בנושא: ${t}.`
  }
};

export async function POST(request: Request) {
  try {
    console.log('📝 API request received');
    const { subject, topic } = await request.json();
    console.log(`📝 Subject: ${subject}, Topic: ${topic}`);

    if (!subject || !topic) {
      console.error('❌ Missing subject or topic');
      return Response.json(
        { error: 'Missing subject or topic' },
        { status: 400 }
      );
    }

    if (!SUBJECTS[subject]) {
      console.error(`❌ Invalid subject: ${subject}`);
      return Response.json(
        { error: 'Invalid subject' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log(`🔑 API Key: ${apiKey ? 'Present ✓' : 'Missing ❌'}`);

    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY not configured');
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('🚀 Initializing Anthropic client...');
    const client = new Anthropic({ apiKey });
    const subjectInfo = SUBJECTS[subject];

    const jsonInstruction = `

החזר JSON בלבד, ללא שום טקסט אחר:
{"questions":[{"question":"טקסט","answers":["א","ב","ג","ד"],"correct":0,"explanation":"הסבר קצר"}]}

דרישות: 5 שאלות, 4 תשובות, correct=אינדקס 0-3, הסבר בעברית קצר.`;

    const fullPrompt = subjectInfo.buildPrompt(topic) + jsonInstruction;
    console.log('📤 Sending request to Claude...');

    const message = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    });

    console.log('✅ Response received from Claude');

    const content = message.content[0];
    if (content.type !== 'text') {
      console.error('❌ Unexpected response type:', content.type);
      throw new Error('Unexpected response type from API');
    }

    const text = content.text;
    console.log(`📄 Response text length: ${text.length} characters`);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      console.error('Response text:', text);
      throw new Error('No JSON found in response');
    }

    console.log('🔍 Parsing JSON...');
    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`✅ JSON parsed successfully`);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      console.error('❌ Invalid response structure');
      throw new Error('Invalid response structure');
    }

    console.log(`✅ Successfully generated ${parsed.questions.length} questions`);
    return Response.json({
      questions: parsed.questions
    });
  } catch (error) {
    console.error('❌ Error generating questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error message:', errorMessage);
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
