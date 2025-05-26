# Papers Platform

## Overview

Papers is a Next.js application that allows users to share past examination papers from universities and colleges. Contributors are compensated based on the advertisement revenue generated through their uploaded content.

## Features

- **Login and Signup**: Users can log in or sign up using email, password, or Google authentication.
- **Home Page**: Displays a navbar, search functionality, recent papers, and an "Ask AI" sidebar.
- **Profile Page**: Users can view and update their personal and contributor information.
- **Upload Page**: Users can upload PDFs to Supabase Storage and insert records into the `question-papers` table.
- **Revenue Model**: Details the revenue distribution and payment process for contributors.
- **Subjects Page**: Displays papers grouped by course name for the selected university.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (Authentication, Storage, Database)
- **AI Integration**: Google Generative AI SDK

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env.local` file in the root directory.
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     GOOGLE_API_KEY=your_google_api_key
     ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app`: Contains the main application pages and components.
- `src/app/api`: Contains API routes for backend functionality.
- `src/app/components`: Contains reusable components used across the application.

## Revenue Model

The platform compensates contributors based on the advertisement revenue generated from their uploaded content. Contributors earn 55% of the total advertising revenue from their uploads and 1% of the total ad revenue from papers uploaded under a university they added.

## Feedback & Support

For questions, feature suggestions, or payout-related queries, reach out at: [rahulyyadav20@outlook.com](mailto:rahulyyadav20@outlook.com)

## Note

We are currently in the version 1 phase and are constantly improving the platform for your ease. Please keep your patience and support up. If you encounter any bugs or difficulties, please feel free to provide feedback.
