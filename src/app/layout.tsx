import { Metadata, Viewport } from "next";
import "./globals.css";
import Head from "./head";

export const metadata: Metadata = {
  title: "Swarm - sua API sob enxame de requisições",
  description:
    "Uma ferramenta simples e eficiente para testes de carga. Swarm é uma ferramenta de teste massivo para APIs que simula milhares de requisições simultâneas, avaliando desempenho, resiliência e escalabilidade com feedback visual em tempo real.",
};

export const viewport: Viewport = {
  themeColor: "#de5d41",
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  width: "device-width",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head />
      <body>{children}</body>
    </html>
  );
}
