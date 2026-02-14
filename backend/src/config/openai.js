const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test OpenAI connection
async function testOpenAIConnection() {
  try {
    // Simple test - list available models
    const models = await openai.models.list();
    console.log('✅ OpenAI connected successfully');
    return true;
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message);
    return false;
  }
}

module.exports = { openai, testOpenAIConnection };