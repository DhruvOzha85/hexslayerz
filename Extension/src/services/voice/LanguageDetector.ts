export class LanguageDetector {
  /**
   * Detects the language of the given text.
   * Returns 'en', 'hi', or 'mr'.
   */
  static detect(text: string): "en" | "hi" | "mr" {
    const cleanText = text.trim();
    if (!cleanText) return "en";

    // 1. Check for Devanagari script (Hindi and Marathi both use Devanagari)
    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    if (!hasDevanagari) {
      return "en";
    }

    // 2. Distinguish between Hindi and Marathi
    // Marathi specific characters: ळ (U+0933), ॲ (U+0904), ऑ (U+0911)
    const marathiChars = /[\u0933\u0904\u0911]/;
    if (marathiChars.test(cleanText)) {
      return "mr";
    }

    // Common Marathi words that rarely/never appear in Hindi
    const marathiWords = [
      "आहे", "आहेत", "नाही", "करून", "येथे", "तेथे", "पण", "आणि", "कसे", "तुम्ही",
      "माझे", "तुझे", "त्यांचा", "त्यांची", "त्यांचे", "होता", "होती", "होते", "झालं",
      "झाले", "काही", "नंतर", "साठी", "मध्ये", "वर", "खाली"
    ];

    // Common Hindi words that rarely/never appear in Marathi
    const hindiWords = [
      "है", "हैं", "नहीं", "यहाँ", "वहाँ", "और", "कैसे", "आप", "मेरा", "तुम्हारा",
      "उनका", "उनकी", "उनके", "था", "थी", "थे", "हुआ", "हुए", "कुछ", "बाद", "लिए",
      "में", "ऊपर", "नीचे"
    ];

    const words = cleanText.split(/\s+/);
    let marathiScore = 0;
    let hindiScore = 0;

    for (const word of words) {
      if (marathiWords.includes(word)) marathiScore++;
      if (hindiWords.includes(word)) hindiScore++;
    }

    if (marathiScore > hindiScore) return "mr";
    if (hindiScore > marathiScore) return "hi";

    // Default to Hindi if Devanagari but tie/unknown
    return "hi";
  }
}
