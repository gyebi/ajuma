export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <a className="brand" href="#hero">
          <span className="brand-mark">A</span>
          <span>Ajuma AI</span>
        </a>

        <nav className="site-footer-nav" aria-label="Footer">
          <a href="#how-it-works">How it works</a>
          <a href="#who-its-for">Who it's for</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <p className="site-footer-copy">© 2026 Ajuma AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
