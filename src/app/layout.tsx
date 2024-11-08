import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "symsic",
  description: "Symbolic music search engine",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        <script src="https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js" defer></script>
        <script src="./createVerovioToolkit.js"></script>
      </head>
      <body>
        <div id="notation"></div>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
