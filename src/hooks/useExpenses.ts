import { useState } from 'react'
import { categorizeExpense } from '@/utils/categorize'

export interface Expense {
  date: string
  paidBy: string
  description: string
  glAccount: string
  amount: number
  hst: number
  net: number
  isUnsure?: boolean
}

export interface MileageInfo {
  totalKms: number
  workKms: number
  workPercentage: number
}

export type Province = keyof typeof provinceTaxRates

// Define the province tax rates object
export const provinceTaxRates = {
  Alberta: 0.05,
  'British Columbia': 0.12,
  Manitoba: 0.12,
  'New Brunswick': 0.15,
  'Newfoundland and Labrador': 0.15,
  'Northwest Territories': 0.05,
  'Nova Scotia': 0.15,
  Nunavut: 0.05,
  Ontario: 0.13,
  'Prince Edward Island': 0.15,
  Quebec: 0.14975,
  Saskatchewan: 0.11,
  Yukon: 0.05
}

export function useExpenses() {
  const [files, setFiles] = useState<File[]>([])
  const [processedData, setProcessedData] = useState<Expense[]>([])
  const [editingData, setEditingData] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [occupation, setOccupation] = useState<string>('')
  const [mileageInfo, setMileageInfo] = useState<MileageInfo | null>(null)
  const [categories, setCategories] = useState<string[]>([
    'Personal', 'Food', 'Gas', 'Car Service', 'Car Cleaning', 
    'Office', 'Insurance', 'Telephone', 'Parking', 
    'Professional Development', 'Health', 'Entertainment', 'Admin'
  ])
  const [province, setProvince] = useState<Province>('Ontario')

  const calculateTax = (amount: number, province: Province) => {
    const taxRate = provinceTaxRates[province] || 0.13 // Default to Ontario if not found
    return amount * taxRate
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const processFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      // Check if it's a CSV file
      if (files[0]?.name.toLowerCase().endsWith('.csv')) {
        // Process CSV locally
        const csvData = await processCSVFiles(files[0])
        const categorizedData = await Promise.all(csvData.map(async (expense: Expense) => {
          const { category, isUnsure } = await categorizeExpense(expense.description, occupation, categories)
          const tax = calculateTax(expense.amount, province)
          return {
            ...expense,
            glAccount: category,
            hst: tax,
            isUnsure
          }
        }))

        setProcessedData(categorizedData)
      } else {
        // Process PDFs via API
        const response = await fetch('/api/process', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to process files')
        }

        const categorizedData = await Promise.all(data.data.map(async (expense: Expense) => {
          // Always include all expenses, even if categorization is uncertain
          const { category, isUnsure } = await categorizeExpense(expense.description, occupation, categories)
          const tax = calculateTax(expense.amount, province)
          return {
            ...expense,
            glAccount: category || 'Uncategorized',  // Default to Uncategorized if no category found
            hst: tax,
            isUnsure
          }
        }))

        setProcessedData(categorizedData)
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to parse CSV files
  const processCSVFiles = async (file: File): Promise<Expense[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const lines = text.split('\n')
          
          // Detect if there's a separator other than comma (e.g., tab, semicolon)
          let separator = ','
          const firstLine = lines[0]
          if (firstLine.includes('\t')) separator = '\t'
          if (firstLine.includes(';')) separator = ';'
          
          const headers = lines[0].split(separator).map(h => h.trim().toLowerCase())
          
          // Detect column indices with better pattern matching
          const dateIndex = headers.findIndex(h => 
            h.includes('date') || h.includes('time') || h.includes('when'))
          
          const descIndex = headers.findIndex(h => 
            h.includes('desc') || h.includes('detail') || 
            h.includes('merchant') || h.includes('transaction') || 
            h.includes('narration') || h.includes('particulars'))
          
          const amountIndex = headers.findIndex(h => 
            h.includes('amount') || h.includes('sum') || 
            h.includes('total') || h.includes('value') || 
            h.includes('debit') || h.includes('credit'))
          
          // Look for category column if it exists
          const categoryIndex = headers.findIndex(h => 
            h.includes('category') || h.includes('type') || 
            h.includes('classification') || h.includes('group'))
          
          // If can't find standard columns, try to infer based on content
          if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
            // Scan a few rows to detect date pattern, description and numbers
            const potentialIndices = inferColumnIndices(lines.slice(1, 5), separator)
            
            if (potentialIndices.dateIndex !== -1 && 
                potentialIndices.descIndex !== -1 && 
                potentialIndices.amountIndex !== -1) {
              // Process with inferred columns
              const expenses = processWithInferredColumns(
                lines, 
                potentialIndices.dateIndex, 
                potentialIndices.descIndex, 
                potentialIndices.amountIndex,
                separator,
                province
              )
              return resolve(expenses)
            } else {
              reject(new Error('CSV format not recognized. Please ensure your CSV has date, description, and amount columns.'))
              return
            }
          }
          
          const expenses: Expense[] = []
          
          // Skip header row
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue
            
            const values = lines[i].split(separator).map(v => v.trim())
            if (values.length < Math.max(dateIndex, descIndex, amountIndex) + 1) continue
            
            // Handle possible quoted values (e.g. "Description, with comma")
            const cleanValues = cleanCSVRow(values)
            
            // Extract amount and handle different formats (negative/positive, currency symbols)
            const amountStr = cleanValues[amountIndex]
            const amount = extractAmount(amountStr)
            if (isNaN(amount) || amount === 0) continue
            
            // Use absolute value for expenses (treat negative or positive the same)
            const absoluteAmount = Math.abs(amount)
            
            // Calculate tax based on province
            const hst = calculateTax(absoluteAmount, province)
            const net = absoluteAmount - hst
            
            // Get or infer category
            let category = 'Uncategorized'
            if (categoryIndex !== -1 && cleanValues[categoryIndex]) {
              category = mapCSVCategory(cleanValues[categoryIndex])
            } else {
              category = inferCategoryFromDescription(cleanValues[descIndex])
            }
            
            // Format date or use as is if already in ISO format
            const dateValue = formatCSVDate(cleanValues[dateIndex])
            
            expenses.push({
              date: dateValue,
              paidBy: 'CSV Import',
              description: cleanValues[descIndex],
              glAccount: category,
              amount: absoluteAmount,
              hst,
              net
            })
          }
          
          // If no expenses were found, try a more flexible approach
          if (expenses.length === 0) {
            const flexibleExpenses = attemptFlexibleCSVParse(text, province)
            if (flexibleExpenses.length > 0) {
              return resolve(flexibleExpenses)
            }
            
            reject(new Error('No valid expense data found in the CSV file.'))
            return
          }
          
          resolve(expenses)
        } catch (error) {
          console.error('Error parsing CSV:', error)
          reject(new Error('Failed to parse CSV file: ' + (error instanceof Error ? error.message : String(error))))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read CSV file'))
      reader.readAsText(file)
    })
  }

  // Helper function to clean CSV rows (handle quoted values)
  const cleanCSVRow = (values: string[]): string[] => {
    const result: string[] = []
    let combined = ''
    let inQuotes = false
    
    for (const value of values) {
      // Count quotes in the value
      const quoteCount = (value.match(/"/g) || []).length
      
      if (!inQuotes && value.startsWith('"') && quoteCount % 2 !== 0) {
        // Start of a quoted value
        inQuotes = true
        combined = value.substring(1)
      } else if (inQuotes) {
        if (value.endsWith('"') && !value.endsWith('\\"')) {
          // End of quoted value
          combined += ',' + value.substring(0, value.length - 1)
          result.push(combined)
          combined = ''
          inQuotes = false
        } else {
          // Middle of quoted value
          combined += ',' + value
        }
      } else {
        // Regular value
        result.push(value)
      }
    }
    
    // Add any remaining combined value
    if (combined) {
      result.push(combined)
    }
    
    return result
  }

  // Helper function to extract amount from various formats
  const extractAmount = (amountStr: string): number => {
    // Remove currency symbols, commas, etc.
    const cleaned = amountStr.replace(/[^\d.-]/g, '')
    return parseFloat(cleaned) || 0
  }

  // Helper function to infer category from description
  const inferCategoryFromDescription = (description: string): string => {
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

  // Helper function to map CSV categories to standard categories
  const mapCSVCategory = (rawCategory: string): string => {
    const category = rawCategory.toLowerCase()
    
    if (category.includes('transport')) return 'Gas'
    if (category.includes('food') || category.includes('grocery') || category.includes('restaurant')) return 'Food'
    if (category.includes('office') || category.includes('supplies')) return 'Office'
    if (category.includes('entertain')) return 'Entertainment'
    if (category.includes('health') || category.includes('medical')) return 'Health'
    if (category.includes('professional') || category.includes('insurance')) return 'Professional Development'
    if (category.includes('personal')) return 'Personal'
    
    return 'Uncategorized'
  }

  // Helper function to format CSV dates
  const formatCSVDate = (dateStr: string): string => {
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
    
    // MMM DD, YYYY (like "Jan 01, 2023")
    const matches = dateStr.match(/(\w{3})\s+(\d{1,2})(?:,|\s+)?\s*(\d{4})/)
    if (matches) {
      const [_, month, day, year] = matches
      const date = new Date(`${month} ${day}, ${year}`)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
    
    // Fallback to today's date
    return new Date().toISOString().split('T')[0]
  }

  // Helper function to infer column indices from data
  const inferColumnIndices = (sampleRows: string[], separator: string) => {
    const result = {
      dateIndex: -1,
      descIndex: -1,
      amountIndex: -1
    }
    
    // Skip if no sample rows
    if (sampleRows.length === 0) return result
    
    // Get first row values
    const values = sampleRows[0].split(separator)
    
    // Look for date patterns
    for (let i = 0; i < values.length; i++) {
      const value = values[i].trim()
      
      // Check for date patterns
      if (/^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}$/.test(value) || // DD/MM/YYYY or MM/DD/YYYY
          /^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}$/.test(value) || // YYYY/MM/DD
          /^[A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4}$/.test(value)) { // Month DD, YYYY
        result.dateIndex = i
        break
      }
    }
    
    // Look for amount patterns (numeric with possible decimals)
    for (let i = 0; i < values.length; i++) {
      const value = values[i].trim()
      if (i !== result.dateIndex && /^[\$\-\+]?\d+(\.\d{2})?$/.test(value.replace(/[,\s]/g, ''))) {
        result.amountIndex = i
        break
      }
    }
    
    // Assume the longest text field that's not date or amount is description
    let maxLength = 0
    for (let i = 0; i < values.length; i++) {
      const value = values[i].trim()
      if (i !== result.dateIndex && i !== result.amountIndex && value.length > maxLength) {
        maxLength = value.length
        result.descIndex = i
      }
    }
    
    return result
  }

  // Helper function to process CSV with inferred columns
  const processWithInferredColumns = (
    lines: string[], 
    dateIndex: number, 
    descIndex: number, 
    amountIndex: number, 
    separator: string,
    province: Province
  ): Expense[] => {
    const expenses: Expense[] = []
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      
      const values = lines[i].split(separator).map(v => v.trim())
      if (values.length <= Math.max(dateIndex, descIndex, amountIndex)) continue
      
      const amountStr = values[amountIndex]
      const amount = extractAmount(amountStr)
      if (isNaN(amount) || amount === 0) continue
      
      const absoluteAmount = Math.abs(amount)
      const hst = calculateTax(absoluteAmount, province)
      const net = absoluteAmount - hst
      
      const dateValue = formatCSVDate(values[dateIndex])
      const description = values[descIndex]
      const category = inferCategoryFromDescription(description)
      
      expenses.push({
        date: dateValue,
        paidBy: 'CSV Import',
        description,
        glAccount: category,
        amount: absoluteAmount,
        hst,
        net
      })
    }
    
    return expenses
  }

  // Helper function to attempt more flexible CSV parsing
  const attemptFlexibleCSVParse = (text: string, province: Province): Expense[] => {
    const expenses: Expense[] = []
    
    // Try to find any lines with a date-like pattern followed by text and a number
    const patterns = [
      // CIBC credit card format: date, description, amount
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([\w\s\&\'\.\-\,\/\(\)]{3,})\s+\$?([\d\.,]+)/g,
      
      // General pattern: date, description, amount 
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})[^\d\n]+([\w\s\&\'\.\-\,\/\(\)]{3,})[^\d\n]+\$?([\d\.,]+)/g,
      
      // Visa/Mastercard format with posting date and transaction date
      /(?:POSTED|POSTED ON|Transaction date)[:\s]+(\d{1,2}[-\/\.]\d{1,2}(?:[-\/\.]\d{2,4})?)[^\d\n]*([\w\s\&\'\.\-\,\/\(\)]{3,})[^\d\n]*\$?([\d\.,]+)/gi,
      
      // Pattern with merchant name emphasized
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})[^\d\n]*(?:at|to)?[^\d\n]*([\w\s\&\'\.\-\,\/\(\)]{3,})[^\d\n]*\$?([\d\.,]+)/gi
    ]
    
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[1]
        const description = match[2].trim().replace(/\s{2,}/g, ' ') // Normalize spaces
        const amountStr = match[3].replace(/,/g, '')
        
        const amount = parseFloat(amountStr)
        if (isNaN(amount) || amount === 0) continue
        
        const absoluteAmount = Math.abs(amount)
        const hst = calculateTax(absoluteAmount, province)
        const net = absoluteAmount - hst
        
        const dateValue = formatCSVDate(dateStr)
        
        // Try to categorize based on description
        const category = inferCategoryFromDescription(description)
        
        // Check if this expense already exists to avoid duplicates
        const isDuplicate = expenses.some(e => 
          e.date === dateValue && 
          e.description === description && 
          Math.abs(e.amount - absoluteAmount) < 0.01
        )
        
        if (!isDuplicate) {
          expenses.push({
            date: dateValue,
            paidBy: 'CSV Import',
            description,
            glAccount: category,
            amount: absoluteAmount,
            hst,
            net
          })
        }
      }
    }
    
    // Special handling for CIBC credit card statements
    if (text.includes('CIBC') || text.includes('Credit Card Statement')) {
      const cibcLinePattern = /(\d{2}\/\d{2})(?:\/\d{2})?\s+(\d{2}\/\d{2})(?:\/\d{2})?\s+([\w\s\&\'\.\-\,\/\(\)]{3,})\s+(?:\$\s*)([\d\.,]+)/g
      
      let match
      while ((match = cibcLinePattern.exec(text)) !== null) {
        const transactionDateStr = match[2] // Use transaction date rather than posting date
        const description = match[3].trim().replace(/\s{2,}/g, ' ')
        const amountStr = match[4].replace(/,/g, '')
        
        const amount = parseFloat(amountStr)
        if (isNaN(amount) || amount === 0) continue
        
        const absoluteAmount = Math.abs(amount)
        const hst = calculateTax(absoluteAmount, province)
        const net = absoluteAmount - hst
        
        // Add current year to date if missing
        let dateValue = formatCSVDate(transactionDateStr)
        
        // If the date is missing a year, add the current year
        if (dateValue.length < 8) {
          const currentYear = new Date().getFullYear()
          dateValue = formatCSVDate(`${transactionDateStr}/${currentYear}`)
        }
        
        const category = inferCategoryFromDescription(description)
        
        // Check for duplicates
        const isDuplicate = expenses.some(e => 
          e.date === dateValue && 
          e.description === description && 
          Math.abs(e.amount - absoluteAmount) < 0.01
        )
        
        if (!isDuplicate) {
          expenses.push({
            date: dateValue,
            paidBy: 'CSV Import',
            description,
            glAccount: category,
            amount: absoluteAmount,
            hst,
            net
          })
        }
      }
    }
    
    // If still empty, try a very aggressive approach for any number-like content
    if (expenses.length === 0) {
      // Look for dollar amounts with descriptions nearby
      const dollarPattern = /(?:[\$\€\£])\s*(\d+(?:\.\d{2})?)\s*([A-Za-z].{5,}?)(?=[\$\€\£]|\d{1,2}\/\d{1,2}|$)/g
      
      let match
      const today = new Date().toISOString().split('T')[0]
      
      while ((match = dollarPattern.exec(text)) !== null) {
        const amountStr = match[1]
        let description = match[2].trim().replace(/\s{2,}/g, ' ')
        
        // Limit description length
        if (description.length > 50) {
          description = description.substring(0, 50) + '...'
        }
        
        const amount = parseFloat(amountStr)
        if (isNaN(amount) || amount === 0) continue
        
        const absoluteAmount = Math.abs(amount)
        const hst = calculateTax(absoluteAmount, province)
        const net = absoluteAmount - hst
        
        // Use today's date as fallback
        const category = inferCategoryFromDescription(description)
        
        expenses.push({
          date: today,
          paidBy: 'CSV Import',
          description,
          glAccount: category,
          amount: absoluteAmount,
          hst,
          net
        })
      }
    }
    
    // Sort expenses by date
    expenses.sort((a, b) => a.date.localeCompare(b.date))
    
    return expenses
  }

  const updateMileageInfo = (field: keyof MileageInfo, value: number) => {
    const currentInfo = mileageInfo || { totalKms: 0, workKms: 0, workPercentage: 0 }
    
    let newInfo: MileageInfo
    
    if (field === 'totalKms') {
      const workPercentage = currentInfo.workKms > 0 ? (currentInfo.workKms / value) * 100 : 0
      newInfo = { ...currentInfo, totalKms: value, workPercentage }
    } else if (field === 'workKms') {
      const workPercentage = currentInfo.totalKms > 0 ? (value / currentInfo.totalKms) * 100 : 0
      newInfo = { ...currentInfo, workKms: value, workPercentage }
    } else {
      newInfo = { ...currentInfo, [field]: value }
    }
    
    setMileageInfo(newInfo)
  }

  // Added for editing and category management functionalities
  const handleEdit = (index: number, field: keyof Expense, value: any) => {
    if (!isEditing) return
    
    const newData = [...editingData]
    newData[index] = { ...newData[index], [field]: value }
    
    // Recalculate tax and net if amount is changed
    if (field === 'amount') {
      const amount = parseFloat(value) || 0
      const hst = calculateTax(amount, province)
      newData[index].hst = hst
      newData[index].net = amount - hst
    }
    
    setEditingData(newData)
  }
  
  const startEditing = () => {
    setEditingData([...processedData])
    setIsEditing(true)
  }
  
  const saveChanges = () => {
    setProcessedData([...editingData])
    setIsEditing(false)
  }
  
  const calculateTotals = (data: Expense[] = processedData) => {
    const totals = {
      amount: 0,
      hst: 0,
      net: 0
    }
    
    if (!data || data.length === 0) {
      return totals
    }
    
    data.forEach(expense => {
      totals.amount += expense.amount
      totals.hst += expense.hst
      totals.net += expense.net
    })
    
    return totals
  }
  
  const addCategory = (category: string) => {
    if (!category || categories.includes(category)) return
    setCategories([...categories, category])
  }
  
  const removeCategory = (category: string) => {
    // Don't remove if it's in use
    const isInUse = processedData.some(expense => expense.glAccount === category)
    if (isInUse) return
    
    setCategories(categories.filter(c => c !== category))
  }

  return {
    files,
    processedData,
    editingData,
    loading,
    error,
    isEditing,
    occupation,
    setOccupation,
    mileageInfo,
    updateMileageInfo,
    categories,
    province,
    setProvince,
    handleFileUpload,
    processFiles,
    handleEdit,
    startEditing,
    saveChanges,
    calculateTotals,
    addCategory,
    removeCategory
  }
} 