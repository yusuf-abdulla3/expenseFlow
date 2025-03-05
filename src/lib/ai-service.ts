import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function categorizeExpense(description: string, occupation?: string, categories: string[] = []): Promise<{
  category: string
  isUnsure: boolean
}> {
  const categoryList = categories.join(', ')
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a financial expense categorizer with knowledge of Canadian tax principles, finances, and business expenditures. 
                  The user's occupation is: ${occupation || 'unknown'}. 
                  Categorize expenses into: ${categoryList}. 
                  Use specific rules to categorize expenses based on keywords and context. 
                  Always provide the most likely category, even if unsure.`
      },
      {
        role: "user",
        content: `Categorize this expense: ${description}`
      }
    ]
  })

  const category = response.choices[0].message?.content || categories[0] // Default to the first category if no response
  const isUnsure = response.choices[0].message?.content?.includes("UNSURE") || false

  return { category, isUnsure }
} 