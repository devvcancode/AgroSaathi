const recommendationCopy = {
  en: {
    brands: { stress: 'Syngenta biostimulant candidate', monitor: 'Monitor and maintain the crop', scout: 'Crop-protection candidates after diagnosis' },
    products: {
      Isabion: { type: 'Biostimulant', composition: 'Amino acids + nutrient peptides', use: 'Frost, heat, drought, and flowering/fruit-set support.' },
      Quantis: { type: 'Biostimulant', composition: 'Potassium, calcium, and organic carbon', use: 'Photosynthesis support during heat stress.' },
    },
    rationale: { stress: 'Elevated heat, night heat, drought, or frost stress detected. This is a stress-support candidate, not a chemical spray prescription.', monitor: 'Current weather signals do not justify a blanket spray. Maintain nutrition and scout before selecting a product.', scout: 'Conditions are moderate. Confirm the pest, disease, or weed first; do not apply a crop-protection product from weather data alone.' },
    timing: { Isabion: 'Apply as a foliar spray when foliage is dry; repeat after 10 days only if stress persists.', Quantis: 'Apply as a foliar spray in a cool, low-wind period; repeat after 10 days only if heat stress persists.' },
    regions: { Punjab: 'Punjab', Maharashtra: 'Maharashtra', India: 'India' },
    days: 'days', mlPerLitre: 'ml/L', water: 'water', product: 'product',
    noStress: 'No stress product needed', scout: 'Scout before spraying',
  },
  hi: {
    brands: { stress: 'सिंजेंटा जैव-उत्तेजक विकल्प', monitor: 'फसल की निगरानी और देखभाल करें', scout: 'निदान के बाद फसल सुरक्षा विकल्प' },
    products: {
      Isabion: { type: 'जैव-उत्तेजक', composition: 'अमीनो एसिड और पोषक पेप्टाइड', use: 'पाला, गर्मी, सूखा और फूल/फल बनने में सहायता।' },
      Quantis: { type: 'जैव-उत्तेजक', composition: 'पोटैशियम, कैल्शियम और जैविक कार्बन', use: 'गर्मी के तनाव में प्रकाश संश्लेषण में सहायता।' },
    },
    rationale: { stress: 'गर्मी, रात की गर्मी, सूखे या पाले का तनाव मिला। यह तनाव-सहायता विकल्प है, रासायनिक छिड़काव का नुस्खा नहीं।', monitor: 'मौसम के संकेत अभी पूरे खेत में छिड़काव का कारण नहीं देते। पोषण बनाए रखें और उत्पाद चुनने से पहले खेत की जाँच करें।', scout: 'स्थिति सामान्य है। पहले कीट, रोग या खरपतवार की पुष्टि करें; केवल मौसम के आधार पर फसल सुरक्षा उत्पाद न लगाएँ।' },
    timing: { Isabion: 'पत्तियाँ सूखी हों तब छिड़काव करें; तनाव बना रहे तो 10 दिन बाद दोहराएँ।', Quantis: 'ठंडे और कम हवा वाले समय में छिड़काव करें; गर्मी का तनाव बना रहे तो 10 दिन बाद दोहराएँ।' },
    regions: { Punjab: 'पंजाब', Maharashtra: 'महाराष्ट्र', India: 'भारत' },
    days: 'दिन', mlPerLitre: 'मिलीलीटर/लीटर', water: 'पानी', product: 'उत्पाद',
    noStress: 'तनाव के लिए उत्पाद की आवश्यकता नहीं', scout: 'छिड़काव से पहले खेत की जाँच करें',
  },
  pa: {
    brands: { stress: 'ਸਿੰਜੈਂਟਾ ਜੈਵ-ਉਤੇਜਕ ਵਿਕਲਪ', monitor: 'ਫ਼ਸਲ ਦੀ ਨਿਗਰਾਨੀ ਅਤੇ ਸੰਭਾਲ ਕਰੋ', scout: 'ਜਾਂਚ ਤੋਂ ਬਾਅਦ ਫ਼ਸਲ ਸੁਰੱਖਿਆ ਵਿਕਲਪ' },
    products: {
      Isabion: { type: 'ਜੈਵ-ਉਤੇਜਕ', composition: 'ਅਮੀਨੋ ਐਸਿਡ ਅਤੇ ਪੋਸ਼ਕ ਪੈਪਟਾਈਡ', use: 'ਕੋਹਰੇ, ਗਰਮੀ, ਸੋਕੇ ਅਤੇ ਫੁੱਲ/ਫਲ ਬਣਨ ਵਿੱਚ ਸਹਾਇਤਾ।' },
      Quantis: { type: 'ਜੈਵ-ਉਤੇਜਕ', composition: 'ਪੋਟਾਸ਼ੀਅਮ, ਕੈਲਸ਼ੀਅਮ ਅਤੇ ਜੈਵਿਕ ਕਾਰਬਨ', use: 'ਗਰਮੀ ਦੇ ਤਣਾਅ ਦੌਰਾਨ ਪ੍ਰਕਾਸ਼ ਸੰਸ਼ਲੇਸ਼ਣ ਵਿੱਚ ਸਹਾਇਤਾ।' },
    },
    rationale: { stress: 'ਗਰਮੀ, ਰਾਤ ਦੀ ਗਰਮੀ, ਸੋਕੇ ਜਾਂ ਕੋਹਰੇ ਦਾ ਤਣਾਅ ਮਿਲਿਆ। ਇਹ ਤਣਾਅ-ਸਹਾਇਤਾ ਵਿਕਲਪ ਹੈ, ਰਸਾਇਣਕ ਛਿੜਕਾਅ ਦੀ ਪਰਚੀ ਨਹੀਂ।', monitor: 'ਮੌਸਮ ਦੇ ਸੰਕੇਤ ਪੂਰੇ ਖੇਤ ਵਿੱਚ ਛਿੜਕਾਅ ਦੀ ਲੋੜ ਨਹੀਂ ਦੱਸਦੇ। ਪੋਸ਼ਣ ਜਾਰੀ ਰੱਖੋ ਅਤੇ ਉਤਪਾਦ ਚੁਣਨ ਤੋਂ ਪਹਿਲਾਂ ਖੇਤ ਦੀ ਜਾਂਚ ਕਰੋ।', scout: 'ਹਾਲਾਤ ਦਰਮਿਆਨੇ ਹਨ। ਪਹਿਲਾਂ ਕੀੜੇ, ਰੋਗ ਜਾਂ ਨਦੀਨ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ; ਸਿਰਫ਼ ਮੌਸਮ ਦੇ ਆਧਾਰ ’ਤੇ ਫ਼ਸਲ ਸੁਰੱਖਿਆ ਉਤਪਾਦ ਨਾ ਵਰਤੋ।' },
    timing: { Isabion: 'ਪੱਤੇ ਸੁੱਕੇ ਹੋਣ ਤਾਂ ਛਿੜਕਾਅ ਕਰੋ; ਤਣਾਅ ਜਾਰੀ ਰਹੇ ਤਾਂ 10 ਦਿਨ ਬਾਅਦ ਦੁਹਰਾਓ।', Quantis: 'ਠੰਢੇ ਅਤੇ ਘੱਟ ਹਵਾ ਵਾਲੇ ਸਮੇਂ ਛਿੜਕਾਅ ਕਰੋ; ਗਰਮੀ ਦਾ ਤਣਾਅ ਜਾਰੀ ਰਹੇ ਤਾਂ 10 ਦਿਨ ਬਾਅਦ ਦੁਹਰਾਓ।' },
    regions: { Punjab: 'ਪੰਜਾਬ', Maharashtra: 'ਮਹਾਰਾਸ਼ਟਰ', India: 'ਭਾਰਤ' },
    days: 'ਦਿਨ', mlPerLitre: 'ਮਿਲੀਲੀਟਰ/ਲੀਟਰ', water: 'ਪਾਣੀ', product: 'ਉਤਪਾਦ',
    noStress: 'ਤਣਾਅ ਲਈ ਉਤਪਾਦ ਦੀ ਲੋੜ ਨਹੀਂ', scout: 'ਛਿੜਕਾਅ ਤੋਂ ਪਹਿਲਾਂ ਖੇਤ ਦੀ ਜਾਂਚ ਕਰੋ',
  },
}

export function getRecommendationCopy(locale) {
  return recommendationCopy[locale] || recommendationCopy.en
}
