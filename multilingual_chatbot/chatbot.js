const responses = {
  en: {
    greeting: "Hello! How can I help you today?",
    farewell: "Goodbye! Have a great day!",
    unknown: "I'm sorry, I didn't understand that. Could you please rephrase?"
  },
  ko: {
    greeting: "안녕하세요! 오늘 어떻게 도와드릴까요?",
    farewell: "안녕히 가세요! 좋은 하루 되세요!",
    unknown: "죄송합니다. 이해하지 못했습니다. 다시 말씀해 주시겠어요?"
  },
  zh: {
    greeting: "你好！今天我能为您做些什么？",
    farewell: "再见！祝您有个愉快的一天！",
    unknown: "对不起，我没听懂。您能再说一遍吗？"
  }
};

function generateResponse(message, language) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('안녕') || lowerMessage.includes('你好')) {
    return responses[language].greeting;
  } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('안녕히') || lowerMessage.includes('再见')) {
    return responses[language].farewell;
  } else {
    return responses[language].unknown;
  }
}

module.exports = { generateResponse };