import './globals.css';

export const metadata = {
  title: 'Lungจั้มมั้ม POS',
  description: 'ระบบขายหน้าร้านสำหรับตุ๊กตามังกรขนฟู Lungจั้มมั้ม',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=Baloo+2:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="navbar">
          <a href="/" className="logo">Lungจั้มมั้ม POS</a>
          <nav>
            <a href="/">รายการสินค้า</a>
            <a href="/sell">ขายสินค้า</a>
            <a href="/history">ประวัติการขาย</a>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
