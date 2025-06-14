This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment Setup

✅ **Environment variables are already configured!**

The `.env.local` file contains all necessary Clerk credentials and MongoDB connection strings.

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

- **Authentication**: Integrated with [Clerk](https://clerk.com) for user authentication
- **Video Background**: Landing page with video background support
- **PWA Support**: Progressive Web App capabilities
- **Responsive Design**: Mobile-first responsive design with Tailwind CSS

## Project Structure

- `/src/app/` - Main application pages
- `/src/app/landing/` - Landing page with video background
- `/src/app/sign-in/` - Clerk sign-in page
- `/src/app/sign-up/` - Clerk sign-up page
- `/public/images/` - Static images and videos
- `/middleware.ts` - Clerk authentication middleware

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Clerk Documentation](https://clerk.com/docs) - learn about Clerk authentication.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
