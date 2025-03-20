'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { ProfileForm } from '@/components/expense/ProfileForm'
import { FileUploader } from '@/components/expense/FileUploader'
import { CategoryManager } from '@/components/expense/CategoryManager'
import { ExpenseList } from '@/components/expense/ExpenseList'
import { ExpenseSummary } from '@/components/expense/ExpenseSummary'
import { SavedExpenses } from '@/components/expense/SavedExpenses'

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const {
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
  } = useExpenses()

  // If authentication is still being checked, show loading
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </main>
    )
  }

  // If not authenticated, the useAuth hook will redirect to /auth
  if (!user) {
    return null
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Expense Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <ProfileForm 
            occupation={occupation}
            setOccupation={setOccupation}
            mileageInfo={mileageInfo}
            updateMileageInfo={updateMileageInfo}
            province={province}
            setProvince={setProvince}
          />
          
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
        </div>
        
        <div>
          <CategoryManager 
            categories={categories}
            addCategory={addCategory}
            removeCategory={removeCategory}
          />
          
          <SavedExpenses />
        </div>
      </div>
      
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
    </main>
  )
}
