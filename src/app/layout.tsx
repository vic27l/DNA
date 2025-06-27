import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Configuração das fontes
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

// Metadata da aplicação
export const metadata: Metadata = {
  title: 'DNA Narrativo - Análise Psicológica Profunda',
  description: 'Descubra as camadas mais profundas da sua personalidade através de uma análise narrativa revolucionária baseada em IA especializada em psicologia.',
  keywords: [
    'análise psicológica',
    'DNA narrativo',
    'personalidade',
    'inteligência artificial',
    'psicologia',
    'autoconhecimento',
    'análise comportamental',
    'perfil psicológico'
  ],
  authors: [{ name: 'DNA Narrativo Team' }],
  creator: 'DNA Narrativo',
  publisher: 'DNA Narrativo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://dna-narrativo.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'DNA Narrativo - Análise Psicológica Profunda',
    description: 'Descubra as camadas mais profundas da sua personalidade através de uma análise narrativa revolucionária.',
    url: 'https://dna-narrativo.com',
    siteName: 'DNA Narrativo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DNA Narrativo - Análise Psicológica Profunda',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNA Narrativo - Análise Psicológica Profunda',
    description: 'Descubra as camadas mais profundas da sua personalidade através de uma análise narrativa revolucionária.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#00f28c',
      },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

// Componente de estrutura HTML
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="pt-BR" 
      className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect para performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch para recursos externos */}
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        
        {/* Preload de recursos críticos */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Meta tags adicionais */}
        <meta name="application-name" content="DNA Narrativo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DNA Narrativo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "DNA Narrativo",
              "description": "Análise psicológica profunda através de narrativas baseada em IA",
              "url": "https://dna-narrativo.com",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL"
              },
              "author": {
                "@type": "Organization",
                "name": "DNA Narrativo Team"
              }
            })
          }}
        />
      </head>
      <body 
        className={`
          ${inter.className} 
          antialiased 
          min-h-screen
          overflow-x-hidden
        `}
        suppressHydrationWarning
      >
        {/* Skip to main content para acessibilidade */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white text-black px-4 py-2 rounded-md"
        >
        Pular para o conteúdo principal
        </a>

        {/* Indicador de carregamento global */}
        <div id="global-loading" className="hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="glass-effect rounded-2xl p-8 flex flex-col items-center space-y-4">
              <div className="spinner w-8 h-8"></div>
              <p className="text-white text-sm">Carregando...</p>
            </div>
          </div>
        </div>

        {/* Container principal */}
        <main 
          id="main-content"
          className="relative z-10 min-h-screen"
          role="main"
          aria-label="Conteúdo principal da aplicação DNA Narrativo"
        >
          {children}
        </main>

        {/* Container para toasts/notificações */}
        <div 
          id="toast-container" 
          className="fixed top-4 right-4 z-50 space-y-2"
          aria-live="polite"
          aria-atomic="true"
        />

        {/* Container para modais */}
        <div 
          id="modal-container" 
          className="fixed inset-0 z-40 pointer-events-none"
          aria-live="assertive"
          aria-atomic="true"
        />

        {/* Analytics e scripts externos */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />

            {/* Hotjar */}
            {process.env.NEXT_PUBLIC_HOTJAR_ID && (
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (function(h,o,t,j,a,r){
                      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                      h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                      a=o.getElementsByTagName('head')[0];
                      r=o.createElement('script');r.async=1;
                      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                      a.appendChild(r);
                    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                  `,
                }}
              />
            )}
          </>
        )}

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />

        {/* Detectar modo offline */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('online', function() {
                document.body.classList.remove('offline');
              });
              
              window.addEventListener('offline', function() {
                document.body.classList.add('offline');
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
