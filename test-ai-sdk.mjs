import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';

async function test() {
  process.env.GROQ_API_KEY = 'invalid_key';
  
  try {
    console.log('Calling streamText...');
    const response = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: 'Hello'
    });
    
    console.log('streamText returned a response object successfully!');
    
    // Simulate Next.js returning the stream with custom onError
    const webResponse = response.toUIMessageStreamResponse({
      onError: (err) => {
        return "Test custom error: " + err.message;
      }
    });
    console.log('HTTP Status:', webResponse.status);
    
    const reader = webResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('Stream Chunk:', Buffer.from(value).toString());
    }
  } catch (err) {
    console.log('--- CAUGHT IN OUTER TRY/CATCH ---');
    console.log(err.message);
  }
}

test();
