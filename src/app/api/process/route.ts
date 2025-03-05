import { NextResponse } from 'next/server'
import { categorizeExpense } from '@/lib/ai-service'
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

interface RawExpense {
  date: string
  paidBy: string
  description: string
  amount: string
  hst: string
  net: string
}

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = new Uint8Array(buffer)
    const loadingTask = pdfjsLib.getDocument({
      data,
      isEvalSupported: false,
      useSystemFonts: true
    })
    
    const pdf = await loadingTask.promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => {
          if ('str' in item) {
            return item.str
          }
          return ''
        })
        .join(' ')
      fullText += text + '\n'
    }

    return fullText
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

function parseExpenses(text: string): RawExpense[] {
  const lines = text.split('\n').filter(line => line.trim())
  const expenses: RawExpense[] = []
  
  // More comprehensive regex to catch all expense entries
  const expenseRegex = /(\w{3}\s\d{2})\s+\w{3}\s\d{2}\s+([^$]+?)\s+(?:[\w\s&]+)\s+(\d+\.\d{2})/g
  
  let match
  const textBlock = lines.join(' ') // Join lines to handle wrapped descriptions
  
  while ((match = expenseRegex.exec(textBlock)) !== null) {
    const date = new Date(match[1] + ' 2024').toLocaleDateString('en-CA')
    const description = match[2].trim()
    const amount = match[3]
    
    // Calculate estimated HST (13%)
    const hst = (parseFloat(amount) * 0.13).toFixed(2)
    const net = (parseFloat(amount) - parseFloat(hst)).toFixed(2)
    
    expenses.push({
      date,
      paidBy: 'VISA',
      description,
      amount,
      hst,
      net
    })
  }

  return expenses
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    
    const processedData = []
    
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const text = await extractTextFromPDF(buffer)
      console.log('Full extracted text:', text) // Debug log
      
      const rawExpenses = parseExpenses(text)
      console.log('Parsed expenses:', rawExpenses) // Debug log
      
      for (const expense of rawExpenses) {
        const { category, isUnsure } = await categorizeExpense(expense.description)
        processedData.push({
          date: expense.date,
          paidBy: expense.paidBy,
          description: expense.description,
          glAccount: category,
          amount: parseFloat(expense.amount),
          hst: parseFloat(expense.hst),
          net: parseFloat(expense.net),
          isUnsure
        })
      }
    }

    console.log('Final processed data:', processedData) // Debug log
    return NextResponse.json({ data: processedData })
  } catch (error) {
    console.error('Error processing files:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process files' 
    }, { status: 500 })
  }
} 