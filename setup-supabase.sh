#!/bin/bash
# Supabase Database Setup Script

echo "🚀 Setting up Supabase Database Connection..."

# Create .env.local file
cat > .env.local << 'EOF'
# Supabase Database Connection
# Pooled connection for app queries (use pgbouncer for connection pooling)
DATABASE_URL="postgresql://postgres:Sksdmdb@2@db.pakkgpgxegopexfweoyu.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations (port 5432)
DIRECT_URL="postgresql://postgres:Sksdmdb@2@db.pakkgpgxegopexfweoyu.supabase.co:5432/postgres"

# Authentication
NEXTAUTH_SECRET="your-secret-key-change-this"
NEXTAUTH_URL="http://localhost:9002"

# Razorpay (if you have these)
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
EOF

echo "✅ Created .env.local file"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push database schema
echo "🗄️  Pushing database schema to Supabase..."
npx prisma db push

echo "✅ Database setup complete!"
echo "🎉 You can now run: npm run dev"
