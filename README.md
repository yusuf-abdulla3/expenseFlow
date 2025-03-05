# Expense Processor - AI-Powered Expense Management

Expense Processor is a web application designed to help users efficiently categorize and manage their expenses using AI. It provides insights through charts and summaries, tailored to Canadian tax principles.

## Features

- 📊 **AI-Powered Categorization**: Automatically categorize expenses using AI with knowledge of Canadian tax principles.
- 🗂️ **Customizable Categories**: Add, view, or remove spending categories.
- 🌍 **Province-Based Tax Calculation**: Calculate taxes based on the selected Canadian province.
- 📝 **Expense Management**: Edit, save, and download expenses as CSV files.
- 📈 **Visual Insights**: View expenses by category through charts and summaries.

## Installation

1. **Clone this repository**

   ```bash
   git clone https://github.com/yourusername/expense-processor.git
   cd expense-processor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   - Create a `.env` file in the root directory.
   - Add your OpenAI API key:

     ```plaintext
     OPENAI_API_KEY=your_openai_api_key_here
     ```

4. **Run the application**

   ```bash
   npm run dev
   ```

   Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage

- **Upload your expense files**: Use the file upload feature to add your expenses.
- **Select your province**: Choose your province to apply the correct tax rate.
- **Process expenses**: Click "Process Files" to categorize and calculate taxes.
- **Edit and download**: Make any necessary edits and download your expenses as a CSV file.

## Configuration

Before using the application, ensure you have:

- An OpenAI API key for AI-powered categorization.
- Correctly set up your environment variables in the `.env` file.

## Tech Stack

- **TypeScript**
- **React**
- **Next.js**
- **OpenAI GPT-4o**
- **Tailwind CSS**

## Project Structure

- **`src/app`**: Main application components and pages.
- **`src/components/ui`**: UI components used throughout the application.
- **`src/lib`**: Utility functions and services, including AI service integration.
- **`tailwind.config.ts`**: Tailwind CSS configuration.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please contact [your email or GitHub profile].