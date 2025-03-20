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
    // Validate parameters
    if (!file) throw new Error('No file provided')
    if (!path) throw new Error('No path provided')
    if (!userId) throw new Error('No userId provided')
    
    console.log('Saving file to storage:', { path, userId, fileSize: file.size })
    
    const filename = `${userId}/${path}`
    
    // Check if we can access the bucket (no need to list all buckets)
    try {
      const { data, error } = await supabase.storage
        .from('expense-files')
        .list('')
        
      if (error) {
        console.error('Error accessing bucket:', error)
        throw error
      }
      
      console.log('Successfully accessed bucket')
    } catch (error) {
      console.error('Error checking bucket access:', error)
      throw new Error('Unable to access storage bucket')
    }
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('expense-files')
      .upload(filename, file, {
        upsert: true,
        contentType: 'text/csv'
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw error
    }
    
    console.log('File uploaded successfully:', data)

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('expense-files')
      .getPublicUrl(filename)
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL')
    }
    
    console.log('Generated public URL:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error('Error saving file to storage:', error)
    throw error // Rethrow so the caller can handle it
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
    // Validate parameters
    if (!userId) throw new Error('No userId provided')
    if (!fileUrl) throw new Error('No fileUrl provided')
    
    console.log('Saving expense record:', { userId, fileUrl, metadata })
    
    const currentYear = new Date().getFullYear();
    const documentName = metadata.filename || `Expense Report ${new Date().toLocaleDateString()}`
    
    const { data, error } = await supabase
      .from('tax_documents')
      .insert([
        {
          user_id: userId,
          document_name: documentName,
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
    
    if (!data || data.length === 0) {
      throw new Error('No data returned after insert')
    }
    
    console.log('Expense record saved successfully:', data[0])
    return data[0].id
  } catch (error) {
    console.error('Error saving tax document:', error)
    throw error // Rethrow so the caller can handle it
  }
} 