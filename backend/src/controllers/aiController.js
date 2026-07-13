const generateDescription = async (req, res) => {
  const { name, category, tags } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Product name and category are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.startsWith('AQ') === false || apiKey.length < 10) {
    console.log('Gemini API key is missing or invalid. Using local fallback template generator.');
    return res.status(200).json({
      description: `Introducing the brand new "${name}"! A premium item crafted under the ${category} category, designed specifically for creator merchandise collectors. ${tags ? 'Featuring unique qualities of: ' + tags + '.' : ''} Crafted with high-grade materials, this exclusive release merges outstanding quality with unique aesthetics. Limited quantities available—order yours today via WhatsApp or Card Checkout!`
    });
  }

  try {
    const prompt = `Write a creative, compelling product description for a creator store product called "${name}" under the "${category}" category. ${tags ? 'Use these search keywords: ' + tags : ''}. Make the description engaging, highlight its unique creator merchandise appeal, and keep it under 80 words. Do not include markdown formatting or quotes.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      throw new Error('Empty response from Gemini API');
    }

    return res.status(200).json({
      description: outputText.trim()
    });

  } catch (error) {
    console.error('Gemini API generation error:', error.message || error);
    // Fallback in case of API failure
    return res.status(200).json({
      description: `Introducing the brand new "${name}"! A premium item crafted under the ${category} category, designed specifically for creator merchandise collectors. ${tags ? 'Featuring unique qualities of: ' + tags + '.' : ''} Crafted with high-grade materials, this exclusive release merges outstanding quality with unique aesthetics. Limited quantities available—order yours today via WhatsApp or Card Checkout!`
    });
  }
};

module.exports = {
  generateDescription
};
