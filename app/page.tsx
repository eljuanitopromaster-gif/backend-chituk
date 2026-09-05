import './chituk.css';
import Script from 'next/script';

export default function ChitukPage() {
  return (
    <>

      <div className="shell">
        <header className="masthead">
          <a href="#feed" className="brand" aria-label="Ir a proyectos"><span className="brand-mark">C</span><span><span
            className="eyebrow">Scripts</span><span className="wordmark">CHITUK</span></span></a>
          <div className="top-actions">
            <div className="presence" title="Pestañas activas de este archivo"><span className="presence-dot"></span><strong
              id="online-count">1</strong><span>en esta vista</span></div>
            <button id="theme-button" className="small-button" type="button">Tema</button>
            <button id="support-button" className="small-button hidden" type="button">Soporte</button>
            <button id="account-chip" className="account-chip" type="button"><span id="avatar-chip" className="avatar">?</span><span
              id="account-name" className="account-name">Mi perfil</span></button>
            <button id="open-auth" className="small-button clay" type="button">Acceder</button>
            <button id="open-publish" className="small-button" type="button">Publicar</button>
          </div>
        </header>
        <main id="feed">
          <section id="ban-bar" className="ban-bar" aria-live="assertive">
            <div><strong>Acceso prohibido</strong>
              <p id="ban-copy">Un administrador ha prohibido el acceso a este usuario.</p>
            </div><button className="small-button clay" data-action="support" type="button">Contactar con soporte</button>
          </section>
          <section id="global-bar" className="global-bar" aria-live="polite"></section>
          <section className="feed-intro">
            <div>
              <p className="eyebrow">archivo vivo · del primero al más reciente</p>
              <h1>Scripts<em>Loger</em></h1>
            </div>
            <p>Una colección local de Scripts listas para usarse.</p>
          </section>
          <div className="feed-tools">
            <div className="search-filters">
              <div className="search-bar-row">
                <input type="text" id="search-input" className="search-input" placeholder="Buscar scripts..." aria-label="Buscar proyectos" />
                <select id="language-filter" className="language-select" aria-label="Filtrar por lenguaje">
                  <option value="all">Todos los lenguajes</option>
                  {/* Se llenará dinámicamente desde JS */}
                </select>
              </div>
            </div>
            <p className="archive-note">Los proyectos nuevos aparecen al final</p>
            <button id="feed-account-action" className="small-button" type="button">Crear una cuenta</button>
          </div>
          <section id="project-list" className="project-list" aria-live="polite"></section>
          <footer className="site-footer">
            <p>&copy; 2026 Chituk ScriptsLoger. Todos los derechos reservados.</p>
            <div className="footer-links">
              <a href="#">Términos y Condiciones</a>
              <a href="#">Política de Cookies</a>
            </div>
          </footer>
        </main>
      </div>
      <div id="notice" className="notice" role="status" aria-live="polite"></div>
      <div id="modal-backdrop" className="backdrop" aria-hidden="true">
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <header className="modal-head">
            <div>
              <p id="modal-kicker" className="eyebrow">CHITUK</p>
              <h2 id="modal-title">Espacio</h2>
            </div><button id="close-modal" className="close" type="button" aria-label="Cerrar">×</button>
          </header>
          <div id="modal-body" className="modal-body"></div>
        </section>
      </div>

      <Script src="/chituk-script.js" strategy="afterInteractive" />
    </>
  );
}
