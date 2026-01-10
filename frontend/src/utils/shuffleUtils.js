// src/utils/shuffleUtils.js
export const deterministicShuffle = (array, seed) => {
  const shuffled = [...array];
  const random = (index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random(i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const shuffleQuestionOptions = (question, userId, questionId) => {
  // Create seed from userId and questionId
  const seedStr = `${userId}${questionId}`.replace(/[^0-9]/g, "");
  const seed = parseInt(seedStr, 10) || 12345;

  // Create options array with original keys preserved
  const originalOptions = [
    {
      originalKey: "A",
      value: question.optionA || "",
      text: question.optionA || "",
    },
    {
      originalKey: "B",
      value: question.optionB || "",
      text: question.optionB || "",
    },
    {
      originalKey: "C",
      value: question.optionC || "",
      text: question.optionC || "",
    },
    {
      originalKey: "D",
      value: question.optionD || "",
      text: question.optionD || "",
    },
  ];

  // Shuffle deterministically - this shuffles the array
  const shuffledArray = deterministicShuffle(originalOptions, seed);

  // Create display options with new keys (A, B, C, D)
  const shuffledOptions = shuffledArray.map((option, index) => ({
    key: String.fromCharCode(65 + index), // A, B, C, D
    value: option.text,
    originalKey: option.originalKey, // Store original for mapping
  }));

  // Create mapping: shuffled key -> original key
  const optionMapping = {};
  shuffledOptions.forEach((option) => {
    optionMapping[option.key] = option.originalKey;
  });

  // Debug log
  console.log("🎲 Shuffle Result:", {
    userId,
    questionId,
    seed,
    originalOrder: originalOptions.map((o) => o.originalKey),
    shuffledOrder: shuffledOptions.map((o) => ({
      display: o.key,
      original: o.originalKey,
    })),
    optionMapping,
    correctAnswer: question.correctAnswer,
  });

  return {
    shuffledOptions,
    optionMapping,
    correctAnswer: question.correctAnswer,
  };
};

export const mapAnswerToOriginal = (selectedAnswer, optionMapping) => {
  if (!selectedAnswer || !optionMapping) {
    console.log("❌ mapAnswerToOriginal: Missing params", {
      selectedAnswer,
      optionMapping,
    });
    return selectedAnswer;
  }

  const selected = selectedAnswer.toUpperCase();
  const original = optionMapping[selected];

  console.log("🗺️ Mapping selected to original:", {
    selected,
    optionMapping,
    original: original || selected,
  });

  return original || selected;
};

export const mapOriginalToShuffled = (originalAnswer, optionMapping) => {
  if (!originalAnswer || !optionMapping) {
    console.log("❌ mapOriginalToShuffled: Missing params", {
      originalAnswer,
      optionMapping,
    });
    return originalAnswer;
  }

  const original = originalAnswer.toUpperCase();

  // Reverse lookup: find which shuffled key points to this original
  for (const [shuffledKey, originalKey] of Object.entries(optionMapping)) {
    if (originalKey === original) {
      // console.log("🔄 Reverse mapping found:", { original, shuffledKey });
      return shuffledKey;
    }
  }

  console.log("⚠️ No reverse mapping found for:", original);
  return originalAnswer;
};
