(function () {
  function initLightbox() {
    document.querySelectorAll('.cs-placeholder-inner img').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => open(img));
    });
  }

  function open(source) {
    const overlay = document.createElement('div');
    overlay.className = 'lb-overlay';

    const img = document.createElement('img');
    img.src = source.src;
    img.alt = source.alt;
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-open')));

    function close() {
      overlay.classList.add('is-closing');
      overlay.classList.remove('is-open');
      setTimeout(() => overlay.remove(), 220);
    }

    overlay.addEventListener('click', e => { if (e.target !== img) close(); });

    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();
