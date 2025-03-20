import { supabase } from '@/lib/supabase'

/**
 * Save a file to Supabase storage
 * @param file The file to save
 * @param path The path to save the file to
 * @param userId The user ID to associate with the file
 * @returns The URL of the saved file
 */
export async function saveFileToStorage(
  file: File | Blob,
  path: string,
  userId: string
): Promise<string | null> {
  try {
    const filename = `${userId}/${path}`
    const { data, error } = await supabase.storage
      .from('expense-files')
      .upload(filename, file, {
        upsert: true,
        contentType: 'text/csv'
      })

    if (error) {
      console.error('Error saving file:', error)
      throw error
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('expense-files')
      .getPublicUrl(filename)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error saving file to storage:', error)
    return null
  }
}

/**
 * Save expense data to Supabase
 * @param userId The user ID to associate with the data
 * @param fileUrl The URL of the saved file
 * @param metadata Additional metadata to save
 * @returns The ID of the saved record
 */
export async function saveExpenseRecord(
  userId: string,
  fileUrl: string,
  metadata: Record<string, any>
): Promise<string | null> {
  try {
    const currentYear = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('tax_documents')
      .insert([
        {
          user_id: userId,
          document_name: metadata.filename || `Expense Report ${new Date().toLocaleDateString()}`,
          document_type: 'expense_report',
          document_url: fileUrl,
          tax_year: currentYear,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error saving tax document:', error)
      throw error
    }

    return data?.[0]?.id || null
  } catch (error) {
    console.error('Error saving tax document:', error)
    return null
  }
} 