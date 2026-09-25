import './globals.css';

export const metadata = {
  title: 'AgroSaathi',
  description: 'Role-based agricultural marketplace and auth demo'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
