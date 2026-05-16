import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export const generateFollowUpQuestion = async (complaintText) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const prompt = `Based on the following complaint, ask exactly ONE short follow-up question that is relevant and helps gather more context or details. 
    Complaint: "${complaintText}"
    Return only the question text, no other conversational text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating AI question:', error);
    return 'Could you please provide more specific details regarding your complaint?'; // fallback
  }
};
