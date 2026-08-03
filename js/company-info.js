/* Fill company legal disclosure from DAOITH_CONFIG (公安备案公示) */
(function () {
  function fill() {
    const cfg = window.DAOITH_CONFIG || {};
    document.querySelectorAll('[data-company-name]').forEach((el) => {
      if (cfg.companyLegalName) el.textContent = cfg.companyLegalName;
    });
    document.querySelectorAll('[data-company-address]').forEach((el) => {
      if (cfg.companyAddress) el.textContent = cfg.companyAddress;
    });
    document.querySelectorAll('[data-company-email]').forEach((el) => {
      if (cfg.companyEmail) {
        el.textContent = cfg.companyEmail;
        if (el.tagName === 'A') el.setAttribute('href', `mailto:${cfg.companyEmail}`);
      }
    });

    const ld = document.getElementById('daoith-org-jsonld');
    if (ld && cfg.companyLegalName && cfg.companyAddress) {
      try {
        const data = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: cfg.companyLegalName,
          url: 'https://www.daoith.com',
          email: cfg.companyEmail || 'service@daoith.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: cfg.companyAddress,
            addressLocality: '深圳市',
            addressRegion: '广东省',
            addressCountry: 'CN',
          },
        };
        ld.textContent = JSON.stringify(data);
      } catch (_) {
        /* ignore */
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  } else {
    fill();
  }
})();
