import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function TaxDocumentUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('W2');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file || !documentName || !user) {
      setMessage('Please select a file and provide a document name');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // Ensure user.id exists
      if (!user.id) {
        throw new Error('User ID is required');
      }

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Ensure fileName is a valid string
      if (!fileName) {
        throw new Error('Invalid file name');
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tax-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: urlData } = supabase.storage
        .from('tax-documents')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      // 3. Save document metadata to the database
      const { data, error } = await supabase
        .from('tax_documents')
        .insert({
          user_id: user.id,
          document_name: documentName,
          document_type: documentType,
          document_url: urlData.publicUrl,
          tax_year: taxYear
        });

      if (error) throw error;
      
      setMessage('Document uploaded successfully!');
      setFile(null);
      setDocumentName('');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Tax Document</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label htmlFor="documentName" className="block text-sm font-medium">
            Document Name
          </label>
          <input
            id="documentName"
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium">
            Document Type
          </label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="W2">W-2</option>
            <option value="1099">1099</option>
            <option value="1098">1098</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="taxYear" className="block text-sm font-medium">
            Tax Year
          </label>
          <input
            id="taxYear"
            type="number"
            value={taxYear}
            onChange={(e) => setTaxYear(parseInt(e.target.value))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        
        <div>
          <label htmlFor="file" className="block text-sm font-medium">
            Document File
          </label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full"
          />
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
      
      {message && (
        <p className={`mt-4 text-sm text-center ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
} 