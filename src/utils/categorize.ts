export async function categorizeExpense(
  description: string, 
  occupation: string, 
  categories: string[]
): Promise<{ category: string, isUnsure: boolean }> {
  const lowerDescription = description.toLowerCase();

  // Apply specific rules based on the context provided
  if (lowerDescription.includes('course') || lowerDescription.includes('training') || lowerDescription.includes('workshop')) {
    return { category: 'Professional Development', isUnsure: false };
  }
  if (lowerDescription.includes('restaurant') || lowerDescription.includes('dinner') || lowerDescription.includes('lunch') || lowerDescription.includes('cafe')) {
    return { category: 'Food', isUnsure: false };
  }
  if (lowerDescription.includes('grocery') || lowerDescription.includes('supermarket')) {
    return { category: 'Food', isUnsure: false };
  }
  if (lowerDescription.includes('subscription') || lowerDescription.includes('membership') || lowerDescription.includes('service')) {
    return { category: 'Admin', isUnsure: false };
  }
  if (lowerDescription.includes('phone') || lowerDescription.includes('mobile') || lowerDescription.includes('cell')) {
    return { category: 'Telephone', isUnsure: false };
  }
  if (lowerDescription.includes('gas') || lowerDescription.includes('fuel')) {
    return { category: 'Gas', isUnsure: false };
  }
  if (lowerDescription.includes('insurance')) {
    return { category: 'Insurance', isUnsure: false };
  }
  if (lowerDescription.includes('parking')) {
    return { category: 'Parking', isUnsure: false };
  }
  if (lowerDescription.includes('office') || lowerDescription.includes('stationery') || lowerDescription.includes('supplies')) {
    return { category: 'Office', isUnsure: false };
  }
  if (lowerDescription.includes('health') || lowerDescription.includes('medical') || lowerDescription.includes('pharmacy')) {
    return { category: 'Health', isUnsure: false };
  }
  if (lowerDescription.includes('entertainment') || lowerDescription.includes('movie') || lowerDescription.includes('concert')) {
    return { category: 'Entertainment', isUnsure: false };
  }
  if (lowerDescription.includes('car service') || lowerDescription.includes('maintenance') || lowerDescription.includes('repair')) {
    return { category: 'Car Service', isUnsure: false };
  }
  if (lowerDescription.includes('cleaning') || lowerDescription.includes('wash')) {
    return { category: 'Car Cleaning', isUnsure: false };
  }

  // Fallback to existing categories
  for (const category of categories) {
    if (lowerDescription.includes(category.toLowerCase())) {
      return { category, isUnsure: true };
    }
  }

  return { category: categories[0], isUnsure: true };
} 