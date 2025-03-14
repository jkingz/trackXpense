import { Poppins } from 'next/font/google';
import './globals.css';

import Header from '@/components/header';
import Footer from '@/components/footer';
import { ClerkProvider } from '@clerk/nextjs';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});
export const metadata = {
  title: 'TrackXpense',
  description: 'All in one expense tracker',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${poppins.className} `}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
