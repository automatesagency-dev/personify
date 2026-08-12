// Estimated cost per successful generation, in cents (AUD). These are rough
// defaults for margin estimation — tune them to your real provider costs via
// env vars once you know your gpt-image / Fal / OpenAI pricing.
const GENERATION_COST_CENTS = {
  image: parseInt(process.env.COST_IMAGE_CENTS || '8', 10), // ~$0.08 / image
  text: parseInt(process.env.COST_TEXT_CENTS || '1', 10),   // ~$0.01 / text gen
};

module.exports = { GENERATION_COST_CENTS };
