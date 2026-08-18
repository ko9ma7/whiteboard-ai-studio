(() => {
  const config = {
    name: "Whiteboard AI Motion Studio",
    siteUrl: "__SITE_URL__",
    buildTime: "__BUILD_TIME__"
  };
  window.WAI_SITE_CONFIG = config;
  const current = location.href.split('#')[0];
  const siteUrl = config.siteUrl.includes('__SITE_URL__') ? current : config.siteUrl;
  const set = (selector, attr, value) => { const el=document.querySelector(selector); if(el) el.setAttribute(attr,value); };
  set('link[rel="canonical"]','href',siteUrl);
  set('meta[property="og:url"]','content',siteUrl);
  const image = new URL('./assets/og-image.png', siteUrl).href;
  set('meta[property="og:image"]','content',image);
  set('meta[name="twitter:image"]','content',image);
  window.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  });
})();
