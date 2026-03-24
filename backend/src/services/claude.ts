import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(prompt: string, retries = 3, maxTokens = 1024): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      const content = message.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
      return content.text;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = attempt * 1000;
      console.warn(`[claude] Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Claude API failed after retries');
}

export function parseJSON<T>(raw: string, fallback?: T): T {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    console.error('[parseJSON] Failed to parse Claude response:', raw.slice(0, 200));
    if (fallback !== undefined) return fallback;
    throw new Error(`Claude returned invalid JSON. Response: ${raw.slice(0, 100)}`);
  }
}
