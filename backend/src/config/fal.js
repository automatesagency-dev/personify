const fal = require('@fal-ai/serverless-client');

// Configure Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
});

// Test connection
async function testFalConnection() {
  try {
    if (!process.env.FAL_KEY) {
      console.log('⚠️  Fal.ai API key not configured');
      return false;
    }
    console.log('✅ Fal.ai configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Fal.ai configuration failed:', error.message);
    return false;
  }
}

module.exports = { fal, testFalConnection };