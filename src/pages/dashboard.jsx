import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import { ProfileForm } from '@/components/expense/ProfileForm';
import { FileUploader } from '@/components/expense/FileUploader';
import { CategoryManager } from '@/components/expense/CategoryManager';
import { ExpenseList } from '@/components/expense/ExpenseList';
import { ExpenseSummary } from '@/components/expense/ExpenseSummary';
import { SavedExpenses } from '@/components/expense/SavedExpenses';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Call useExpenses hook before any conditional returns
  const {
    files,
    processedData,
    editingData,
    mileageInfo,
    loading,
    error,
    isEditing,
    categories,
    addCategory,
    removeCategory,
    handleFileUpload,
    processFiles,
    handleEdit,
    startEditing,
    saveChanges,
    calculateTotals
  } = useExpenses();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
      } else {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  if (isLoading || authLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Please wait while we load your dashboard.</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /auth in the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Expense Processor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <FileUploader 
            files={files}
            handleFileUpload={handleFileUpload}
            processFiles={processFiles}
            loading={loading}
            error={error}
            processedData={processedData}
            mileageInfo={mileageInfo}
            calculateTotals={calculateTotals}
          />
          
          {processedData.length > 0 && (
            <>
              <CategoryManager 
                categories={categories}
                addCategory={addCategory}
                removeCategory={removeCategory}
              />
              <ExpenseList 
                processedData={processedData}
                isEditing={isEditing}
                editingData={editingData}
                startEditing={startEditing}
                saveChanges={saveChanges}
                handleEdit={handleEdit}
                mileageInfo={mileageInfo}
                calculateTotals={calculateTotals}
              />
              <ExpenseSummary 
                processedData={processedData}
                mileageInfo={mileageInfo}
                calculateTotals={calculateTotals}
              />
            </>
          )}
        </div>
        
        <div>
          <ProfileForm />
          <SavedExpenses />
        </div>
      </div>
    </div>
  );
} 