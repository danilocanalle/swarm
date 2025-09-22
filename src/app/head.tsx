export default function Head() {
  return (
    <>
      {/* Favicons */}
      <link
        rel="apple-touch-icon"
        sizes="16x16"
        href={"/favicon/favicon-16x16.png"}
      />
      <link
        rel="apple-touch-icon"
        sizes="32x32"
        href={"/favicon/favicon-32x32.png"}
      />

      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href={"/favicon/android-chrome-192x192.png"}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={"/favicon/favicon-32x32.png"}
      />

      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={"/favicon/favicon-16x16.png"}
      />

      <meta name="mobile-web-app-capable" content="yes"></meta>

      {/* iOS Safari */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
    </>
  );
}
