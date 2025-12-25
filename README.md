# FundEd - Student Payment & Event Management System

FundEd is a modern, full-stack web application designed to streamline event payment tracking and student management for educational institutions. It features a premium, glassmorphism-inspired UI and a robust admin dashboard for managing transactions, students, and events.

![FundEd Banner](/public/icon-512x512.png) 
*(Replace with actual screenshot)*

## ✨ Key Features

### 🎓 Student Portal
-   **Public Status Check**: Students can verify their payment status instantly using their Name or Roll Number at `/check-status`.
-   **Payment Ledger**: Detailed view of paid, due, and verified transactions.
-   **Mobile Responsive**: Optimized experience for checking status on the go.

### 🛡️ Admin Dashboard
-   **Student Management**: Add, search, and manage student records.
-   **Event Management**: Create and track multiple events with individual costs.
-   **Payment Processing**:
    -   **QR Code Upload**: Drag & drop support for payment screenshots.
    -   **Verification Workflow**: Mark payments as Paid, Pending, or Failed.
    -   **Receipt Generation**: Auto-generate downloadable PDF receipts.
-   **Analytics**: Visual reports on collection status and fund distribution.

### 🎨 UI/UX Design
-   **Glassmorphism**: A unified, translucent frosted-glass aesthetic across the entire app.
-   **Dark Mode**: A sleek, emerald-themed dark interface.
-   **Smooth Animations**: Fluid transitions and micro-interactions.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Prisma ORM](https://www.prisma.io/))
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Utilities**: `clsx`, `tailwind-merge`, `date-fns`

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
-   Node.js 18+ installed
-   PostgreSQL database (local or cloud like Neon/Supabase)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/FundEd-SKSBANK/fundEd-Web.git
    cd fundEd-Web
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add the following:
    ```env
    # Database Connection
    DATABASE_URL="postgresql://user:password@localhost:5432/funded_db"

    # Authentication (if applicable)
    NEXTAUTH_SECRET="your-secret-key"
    NEXTAUTH_URL="http://localhost:3000"
    
    # App Config
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Setup Database**
    Push the Prisma schema to your database:
    ```bash
    npx prisma db push
    ```

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📂 Project Structure

```bash
src/
├── actions/        # Server Actions (Data mutations)
├── app/            # Next.js App Router pages
│   ├── check-status/   # Public Student Portal
│   ├── dashboard/      # Admin Protected Area
│   └── page.tsx        # Landing Page
├── components/     # Reusable UI Components
│   ├── ui/             # Shadcn Primitives (Button, Card, etc.)
│   └── ...             # Feature components
├── lib/            # Utilities & Types
└── prisma/         # Database Schema
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
