import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface TaxDocument {
  id: string
  user_id: string
  document_name: string
  document_type: string
  document_url: string
  tax_year: number
  created_at: string
  updated_at: string
}

export function SavedExpenses() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (user) {
      fetchSavedDocuments()
    }
  }, [user])
  
  const fetchSavedDocuments = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tax_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching saved documents:', error)
      toast.error('Failed to load saved documents')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownload = (documentUrl: string) => {
    window.open(documentUrl, '_blank')
  }
  
  const handleDelete = async (id: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('tax_documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) {
        throw error
      }
      
      setDocuments(documents.filter(doc => doc.id !== id))
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }
  
  if (!user) {
    return null
  }
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Saved Tax Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading saved documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No saved tax documents found
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map(doc => (
              <div 
                key={doc.id} 
                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-medium">
                    {doc.document_name}
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>Type: {doc.document_type}</p>
                    <p>Tax Year: {doc.tax_year}</p>
                    <p>Created: {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 self-end md:self-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => handleDownload(doc.document_url)}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 