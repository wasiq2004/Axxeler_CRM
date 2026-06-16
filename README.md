<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

**Prerequisites:**  Node.js, PostgreSQL, Redis


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, JWT secrets, Redis, Resend, Razorpay, and Meta/WhatsApp keys.
3. Generate Prisma and migrate the database:
   `npm run db:generate`
   `npm run db:migrate`
   `npm run db:seed`
4. Run the app with the backend:
   `npm run dev:full`
5. Or run only the frontend:
   `npm run dev`

Default seeded users:
- `admin@ziya.com` / `admin123`
- `manager@ziya.com` / `manager123`
- `team@ziya.com` / `team123`
