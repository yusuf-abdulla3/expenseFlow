import { NextRequest, NextResponse } from 'next/server'
import { categorizeExpense } from '@/utils/categorize'
// Use pdf-lib instead of pdfjs-dist for server-side PDF processing
import { PDFDocument } from 'pdf-lib'

interface RawExpense {
  date: string
  paidBy: string
  description: string
  amount: number
  category?: string
  glAccount?: string
  hst?: number
  net?: number
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const numPages = pdfDoc.getPageCount()
    
    console.log(`PDF has ${numPages} pages`)
    
    // Build a string representation of the PDF content
    let fullText = ''
    
    // First, try to get all the text content
    // Since we can't directly access text content with pdf-lib,
    // we'll use a different approach by capturing page structure
    
    for (let i = 0; i < numPages; i++) {
      const page = pdfDoc.getPage(i)
      const { width, height } = page.getSize()
      
      // Append page info to the full text (this helps with pattern matching)
      fullText += `Page ${i + 1} [${width}x${height}]\n`
      
      // Add the raw PDF structure as text to help with extraction
      fullText += `Page content area\n`
      
      // For credit card statements, we can examine the raw PDF structure as string
      // which often contains transaction data even if we can't get the formatted text
      try {
        fullText += page.node.toString() + '\n'
        fullText += page.doc.toString() + '\n'
      } catch (err) {
        console.log('Could not stringify page structure:', err)
      }
    }
    
    return fullText
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function parseExpenses(text: string): RawExpense[] {
  const expenses: RawExpense[] = []
  
  // Check if this looks like a credit card statement
  const isCreditCardStatement = /credit card|statement|transaction|payment due|balance|purchase/i.test(text)
  
  if (isCreditCardStatement) {
    console.log('Detected credit card statement format')
    
    // Try different patterns to match transaction lines in credit card statements
    
    // Pattern 1: Date + Description + Amount (common in many statements)
    // This captures: 
    // - A date in various formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
    // - A description (merchant name, etc.)
    // - A dollar amount
    const pattern1 = /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})[^\d\n]+([\w\s\&\'\.\-\,\/\(\)]{3,})[^\d\n]+([\$\€\£]?\s*\d+(?:\.\d{2})?)/g
    
    let match1
    while ((match1 = pattern1.exec(text)) !== null) {
      const dateStr = match1[1]
      const description = match1[2].trim().replace(/\s{2,}/g, ' ') // Normalize spaces
      const amountStr = match1[3].replace(/[\$\€\£\,\s]/g, '')
      
      const amount = parseFloat(amountStr)
      if (!isNaN(amount) && amount > 0) {
        const date = formatDate(dateStr)
        
        // Try to infer a category
        const category = inferCategoryFromDescription(description)
        
        // Check for duplicates before adding
        const isDuplicate = expenses.some(e => 
          e.date === date && 
          e.description === description && 
          Math.abs(e.amount - amount) < 0.01
        )
        
        if (!isDuplicate) {
          expenses.push({
            date,
            paidBy: 'Credit Card',
            description,
            amount,
            category
          })
        }
      }
    }
    
    // Pattern 2: CIBC format (posting date + transaction date + description + amount)
    const pattern2 = /(?:POSTED|POSTED ON|Transaction date)[:\s]+(\d{1,2}[-\/\.]\d{1,2}(?:[-\/\.]\d{2,4})?)[^\d\n]*([\w\s\&\'\.\-\,\/\(\)]{3,})[^\d\n]*([\$\€\£]?\s*\d+(?:\.\d{2})?)/gi
    
    let match2
    while ((match2 = pattern2.exec(text)) !== null) {
      const dateStr = match2[1]
      const description = match2[2].trim().replace(/\s{2,}/g, ' ')
      const amountStr = match2[3].replace(/[\$\€\£\,\s]/g, '')
      
      const amount = parseFloat(amountStr)
      if (!isNaN(amount) && amount > 0) {
        const date = formatDate(dateStr)
        const category = inferCategoryFromDescription(description)
        
        const isDuplicate = expenses.some(e => 
          e.date === date && 
          e.description === description && 
          Math.abs(e.amount - amount) < 0.01
        )
        
        if (!isDuplicate) {
          expenses.push({
            date,
            paidBy: 'Credit Card',
            description,
            amount: amount,
            category
          })
        }
      }
    }
    
    // Pattern 3: Look for dollar amounts with nearby text
    if (expenses.length === 0) {
      const pattern3 = /(?:[\$\€\£])\s*(\d+(?:\.\d{2})?)\s*([A-Za-z].{5,}?)(?=[\$\€\£]|\d{1,2}\/\d{1,2}|$)/g
      
      let match3
      const today = new Date().toISOString().split('T')[0]
      
      while ((match3 = pattern3.exec(text)) !== null) {
        const amountStr = match3[1]
        let description = match3[2].trim().replace(/\s{2,}/g, ' ')
        
        // Limit description length
        if (description.length > 50) {
          description = description.substring(0, 50) + '...'
        }
        
        const amount = parseFloat(amountStr)
        if (!isNaN(amount) && amount > 0) {
          const category = inferCategoryFromDescription(description)
          
          expenses.push({
            date: today, // Use today as fallback
            paidBy: 'Credit Card',
            description,
            amount: amount,
            category
          })
        }
      }
    }
  } else {
    // For general receipts or invoices (non-credit card statements)
    // Look for patterns like "Total: $XX.XX" or "Amount: $XX.XX"
    const totalPattern = /(?:total|amount|sum|payment|charge|price)(?:\s*:)?\s*([\$\€\£]?\s*\d+(?:\.\d{2})?)/i
    const totalMatch = text.match(totalPattern)
    
    if (totalMatch) {
      const amountStr = totalMatch[1].replace(/[\$\€\£\,\s]/g, '')
      const amount = parseFloat(amountStr)
      
      if (!isNaN(amount) && amount > 0) {
        // Try to find a date
        const datePattern = /(?:date|issued|receipt)(?:\s*:)?\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})/i
        const dateMatch = text.match(datePattern)
        
        const date = dateMatch ? formatDate(dateMatch[1]) : new Date().toISOString().split('T')[0]
        
        // Try to determine what was purchased
        let description = 'Unknown purchase'
        const itemPattern = /(?:item|product|service|description)(?:\s*:)?\s*([A-Za-z].*?)(?:\n|$)/i
        const itemMatch = text.match(itemPattern)
        
        if (itemMatch) {
          description = itemMatch[1].trim()
        } else {
          // Use the first non-empty line as description
          const lines = text.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed && !trimmed.match(/page|pdf|statement|invoice|receipt/i)) {
              description = trimmed
              break
            }
          }
        }
        
        // Truncate description if too long
        if (description.length > 100) {
          description = description.substring(0, 100) + '...'
        }
        
        const category = inferCategoryFromDescription(description)
        
        expenses.push({
          date,
          paidBy: 'Receipt',
          description,
          amount: amount,
          category
        })
      }
    }
  }
  
  // Add placeholders if we couldn't extract any expenses
  if (expenses.length === 0) {
    console.log('No expenses detected, adding placeholder')
    
    // Create a single placeholder expense
    expenses.push({
      date: new Date().toISOString().split('T')[0],
      paidBy: 'PDF Import',
      description: 'Could not detect expenses in this PDF. Try a different format or upload CSV instead.',
      amount: 0,
      category: 'Uncategorized'
    })
  }
  
  // Calculate HST and add GL account
  return expenses.map(exp => ({
    date: exp.date,
    paidBy: exp.paidBy,
    description: exp.description,
    glAccount: exp.category || 'Uncategorized', // Default to Uncategorized if no category found
    amount: exp.amount,
    hst: Number((exp.amount * 0.13).toFixed(2)),
    net: Number((exp.amount * 0.87).toFixed(2))
  }))
}

// Helper function to format dates
function formatDate(dateStr: string): string {
  // If already in ISO format (YYYY-MM-DD), return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  
  // Try to parse the date with various formats
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  
  // Try different date formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
  let parsed = null
  
  // MM/DD/YYYY or DD/MM/YYYY
  const slashParts = dateStr.split('/')
  if (slashParts.length === 3) {
    // Try both ways
    parsed = new Date(`${slashParts[2]}-${slashParts[0]}-${slashParts[1]}`) // MM/DD/YYYY
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
    
    parsed = new Date(`${slashParts[2]}-${slashParts[1]}-${slashParts[0]}`) // DD/MM/YYYY
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  }
  
  // DD-MM-YYYY or MM-DD-YYYY
  const dashParts = dateStr.split('-')
  if (dashParts.length === 3) {
    // Try both ways
    parsed = new Date(`${dashParts[2]}-${dashParts[0]}-${dashParts[1]}`) // MM-DD-YYYY
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
    
    parsed = new Date(`${dashParts[2]}-${dashParts[1]}-${dashParts[0]}`) // DD-MM-YYYY
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  }
  
  // If all else fails, return today's date
  return new Date().toISOString().split('T')[0]
}

// Helper function to infer category from description
function inferCategoryFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase()
  
  // Gas/Transportation related
  if (lowerDesc.match(/gas|petro|esso|shell|hughes|petroleum|7-eleven|circle k|fuel|car wash|airbnb|westjet|air canada|uber|lyft|taxi|transportation|go transit|via rail|transit|ttc|gas bar|husky|gas station|petrocan/i)) {
    return 'Gas'
  }
  
  // Car Service
  if (lowerDesc.match(/car service|mechanic|auto repair|car repair|tire|oil change|jiffy lube|canadian tire auto|midas|mr lube|kal tire|active green ross|dealership service|car dealership/i)) {
    return 'Car Service'
  }
  
  // Car Cleaning
  if (lowerDesc.match(/car wash|auto spa|car detailing|wax|detailing|clean car/i)) {
    return 'Car Cleaning'
  }
  
  // Food/Restaurant related
  if (lowerDesc.match(/restaurant|cafe|coffee|tim hortons|tims|starbuck|timmy|dairy queen|food|lunch|dinner|grocery|supermarket|bakery|shawarma|popeyes|subway|a&w|mcdonalds|pizza|second cup|freshco|loblaws|shoppers|walmart|supercenter|wendy|harvey|swiss chalet|kfc|burger|taco|sushi|pho|thai|chipotle|panera|dominos|papa john|little caesars|metro|sobeys|longos|farm boy|food basic|no frills|costco|sam|wholesale club|grocery gateway|instacart|uber eat|doordash|skip the dishes|foodora/i)) {
    return 'Food'
  }
  
  // Office supplies
  if (lowerDesc.match(/office|supplies|canadian tire|home depot|staples|fabricland|paper|printer|ink|toner|business card|dollar store|dollarama|ikea|wayfair|best buy|the source|depot|staple|amazon|indigo|chapters|book|journal|pen|marker|stationery/i)) {
    return 'Office'
  }
  
  // Entertainment
  if (lowerDesc.match(/cinema|movie|theatre|cineplex|entertainment|museum|park|netflix|spotify|apple music|youtube|amazon prime|disney|hulu|crave|tidal|deezer|pandora|hbo|streaming|game|playstation|xbox|nintendo|ticket|concert|festival|event|show|theater|venue|club|bar|pub|alcohol|lcbo|beer store|wine rack/i)) {
    return 'Entertainment'
  }
  
  // Health related
  if (lowerDesc.match(/pharmacy|drug mart|clinic|doctor|medical|shoppers|health|dental|dentist|eye|optical|glasses|contact|prescription|rexall|medicine|pharma|physio|chiropractor|massage|therapy|psychologist|counselling|wellness|gym|fitness|workout|exercise/i)) {
    return 'Health'
  }
  
  // Insurance/Professional services
  if (lowerDesc.match(/insurance|professional|financial|economical|pembridge|waterloo|linkedin|consulting|lawyer|accountant|legal|accounting|tax|service|advisor|broker|aviva|intact|belair|td insurance|rbc insurance|allstate|state farm|the co-operators|wawanesa|desjardins|sonnet|caa/i)) {
    return 'Insurance'
  }
  
  // Telephone/Internet
  if (lowerDesc.match(/phone|mobile|cell|wireless|rogers|bell|telus|fido|koodo|virgin|freedom|shaw|cogeco|internet|telecom|communication|data plan|long distance|roaming|text message|wifi|broadband/i)) {
    return 'Telephone'
  }
  
  // Parking
  if (lowerDesc.match(/parking|lot|garage|meter|hangtag|pass|city of|municipal|green p|impark|indigo|precise|diamond parking|honk|paybyphone|parkopedia|roam|parkmobile/i)) {
    return 'Parking'
  }
  
  // Professional Development
  if (lowerDesc.match(/professional|development|course|training|seminar|workshop|conference|webinar|certification|education|learning|skill|tutorial|udemy|coursera|linkedin learning|pluralsight|edx|skillshare|masterclass|college|university|online course|continuing education|convention|association|membership/i)) {
    return 'Professional Development'
  }
  
  // Admin
  if (lowerDesc.match(/admin|administrative|clerical|secretary|assistant|office manager|reception|front desk/i)) {
    return 'Admin'
  }
  
  return 'Uncategorized'
}

export async function POST(request: NextRequest) {
  console.log('Processing PDF files...')
  
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    console.log(`Received ${files.length} files for processing`)
    
    if (files.length === 0) {
      return NextResponse.json({ 
        error: 'No files received' 
      }, { status: 400 })
    }
    
    const results = []
    
    for (const file of files) {
      console.log(`Processing file: ${file.name}`)
      
      if (file.type === 'application/pdf') {
        // For PDF files
        try {
          const text = await extractTextFromPDF(file)
          console.log('Extracted text length:', text.length)
          
          // Dump first 500 chars to debug
          console.log('Sample text:', text.substring(0, 500))
          
          const expenses = parseExpenses(text)
          console.log(`Found ${expenses.length} expenses in PDF`)
          
          if (expenses.length > 0) {
            results.push(...expenses)
          } else {
            // If no expenses found, provide sample data with a message
            console.log('No expenses found in the PDF, providing sample data')
            results.push({
              date: new Date().toISOString().split('T')[0],
              paidBy: 'Sample',
              description: 'No expenses found in the uploaded PDF. Please check the format.',
              amount: 0,
              glAccount: 'Uncategorized',
              hst: '0.00',
              net: '0.00'
            })
          }
        } catch (error) {
          console.error('Error processing PDF:', error)
          throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`)
        }
      } else {
        // For non-PDF files (should be handled on client side, but just in case)
        throw new Error(`Unsupported file type: ${file.type}. Please upload PDF files.`)
      }
    }
    
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 })
  }
} 