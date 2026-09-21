import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "PGD - Payment Gateway Dashboard",
  description: "A dummy payment gateway dashboard for development and testing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
