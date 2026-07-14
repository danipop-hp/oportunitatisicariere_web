document.addEventListener('DOMContentLoaded', () => {
  const membersWrapper = document.querySelector('#teamWrapper');
  if (!membersWrapper) return; // Only run on pages that have the team grid

  let isWololoActive = false;
  let isWololoDisabled = false;
  let bogaClickCount = 0;
  const requiredClicks = Math.random() < 0.5 ? 6 : 7;

  // Check URL query parameters for kill switch (?wololo=false)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('wololo') === 'false') {
    isWololoDisabled = true;
  }

  // Path resolver
  const resolvePath = (targetPath) => {
    const depth = window.location.pathname.includes('/html/') ? '../' : './';
    const cleanPath = targetPath.replace(/^(\.\/|\/)/, '');
    return `${depth}${cleanPath}`;
  };

  // Inject Wololo animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wololo-convert {
      0% {
        transform: scale(1);
        box-shadow: none;
      }
      50% {
        transform: scale(1.08);
        box-shadow: 0 0 25px rgba(0, 242, 254, 0.6);
        border-color: #00f2fe;
      }
      100% {
        transform: scale(1);
        box-shadow: none;
      }
    }
    @keyframes sebi-bounce-shake {
      0% { transform: scale(1); }
      20% { transform: scale(0.9) rotate(-4deg); }
      40% { transform: scale(1.1) rotate(4deg); }
      60% { transform: scale(0.95) rotate(-3deg); }
      80% { transform: scale(1.05) rotate(3deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    .wololo-animation {
      animation: wololo-convert 0.6s ease-in-out;
      transition: all 0.5s ease-in-out;
    }
    .sebi-interactive-avatar {
      cursor: pointer;
      transition: transform 0.1s ease;
    }
    .sebi-click-animation {
      animation: sebi-bounce-shake 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);

  const wololoAudio = new Audio(resolvePath('assets/Wololo/wololo.mp3'));

  const playWololoSound = () => {
    wololoAudio.currentTime = 0;
    wololoAudio.play().catch((err) => console.log('Audio playback failed:', err));
  };

  function convertCard(card) {
    const img = card.querySelector('img');
    const nameEl = card.querySelector('.name') || card.querySelector('h3');
    const roleEl = card.querySelector('.role');

    if (img) {
      if (!img.dataset.originalSrc) {
        img.dataset.originalSrc = img.src;
      }
      img.src = resolvePath('assets/Wololo/wololo2.png');
    }
    if (nameEl) {
      if (!nameEl.dataset.originalText) {
        nameEl.dataset.originalText = nameEl.textContent;
      }
      nameEl.textContent = 'Wololoooed';
    }
    if (roleEl) {
      if (!roleEl.dataset.originalText) {
        roleEl.dataset.originalText = roleEl.textContent;
      }
      roleEl.textContent = 'opencode acolyte';
    }
  }

  function revertCard(card) {
    const img = card.querySelector('img');
    const nameEl = card.querySelector('.name') || card.querySelector('h3');
    const roleEl = card.querySelector('.role');

    if (img && img.dataset.originalSrc) {
      img.src = img.dataset.originalSrc;
      delete img.dataset.originalSrc;
    }
    if (nameEl && nameEl.dataset.originalText) {
      nameEl.textContent = nameEl.dataset.originalText;
      delete nameEl.dataset.originalText;
    }
    if (roleEl && roleEl.dataset.originalText) {
      roleEl.textContent = roleEl.dataset.originalText;
      delete roleEl.dataset.originalText;
    }
  }

  function triggerWololoEffect() {
    isWololoActive = true;

    // Change team button names to 'Departament AI' one by one, every second
    const buttons = document.querySelectorAll('.team-btn');
    buttons.forEach((btn, index) => {
      setTimeout(() => {
        if (!isWololoActive) return; // Guard if reverted mid-sequence
        if (!btn.dataset.originalText) {
          btn.dataset.originalText = btn.textContent;
        }
        btn.textContent = 'Departament AI';
      }, index * 1000);
    });

    const cards = document.querySelectorAll('.member-card, .founder-card');

    cards.forEach((card, index) => {
      setTimeout(() => {
        if (!isWololoActive) return; // Guard if reverted mid-sequence

        const img = card.querySelector('img');
        const isNotConverted = img && !img.src.includes('wololo2.png');

        if (isNotConverted) {
          card.classList.add('wololo-animation');
          playWololoSound(); // Trigger sound when the animation starts
        }

        setTimeout(() => {
          if (!isWololoActive) return; // Guard if reverted mid-sequence
          if (isNotConverted) {
            convertCard(card);
          }
        }, 300);

        setTimeout(() => {
          if (isNotConverted) {
            card.classList.remove('wololo-animation');
          }
        }, 600);
      }, index * 500); // Stagger conversions every 0.5 seconds
    });
  }

  const killWololo = () => {
    isWololoActive = false;
    isWololoDisabled = true;
    bogaClickCount = 0;

    // Revert all cards
    document.querySelectorAll('.member-card, .founder-card').forEach(revertCard);

    // Revert all team buttons
    document.querySelectorAll('.team-btn').forEach((btn) => {
      if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
        delete btn.dataset.originalText;
      }
    });

    // Remove active styles from Sebi's avatar
    const sebiImg = document.querySelector('.sebi-interactive-avatar');
    if (sebiImg) {
      sebiImg.classList.remove('sebi-interactive-avatar');
    }

    console.log('Wololo easter egg has been deactivated and reverted.');
  };

  // Expose kill switch globally
  window.killWololo = killWololo;

  // Add Escape key listener as a quick kill switch
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isWololoActive) {
      killWololo();
    }
  });

  // Watch for new member cards being rendered dynamically
  const observer = new MutationObserver((mutations) => {
    // 1. If active, convert new cards immediately
    if (isWololoActive) {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && node.classList.contains('member-card')) {
              convertCard(node);
            } else {
              const card = node.querySelector && node.querySelector('.member-card');
              if (card) convertCard(card);
            }
          }
        });
      });
    }

    // 2. Attach interactive styles/click handler to Sebastian Boga's avatar if not active/disabled
    if (!isWololoActive && !isWololoDisabled) {
      // Find Sebastian Boga card on the Core team
      const activeBtn = document.querySelector('#teamNavbar .team-btn.active');
      const isActiveTeamCore = activeBtn && activeBtn.textContent.trim() === 'Core';

      if (isActiveTeamCore) {
        const cards = membersWrapper.querySelectorAll('.member-card');
        cards.forEach((card) => {
          const nameEl = card.querySelector('.name');
          const isSebastian = nameEl && nameEl.textContent.trim() === 'Sebastian Boga';

          if (isSebastian) {
            const img = card.querySelector('img');
            if (img && !img.classList.contains('sebi-interactive-avatar')) {
              img.classList.add('sebi-interactive-avatar');
            }
          }
        });
      }
    }
  });

  observer.observe(membersWrapper, { childList: true, subtree: true });

  // Use event delegation on the wrapper for click events
  membersWrapper.addEventListener('click', (event) => {
    if (isWololoActive || isWololoDisabled) return;

    const img = event.target.closest('.member-card img');
    if (!img) return;

    const card = img.closest('.member-card');
    if (!card) return;

    const nameEl = card.querySelector('.name');
    const isSebastian = nameEl && nameEl.textContent.trim() === 'Sebastian Boga';

    const activeBtn = document.querySelector('#teamNavbar .team-btn.active');
    const isActiveTeamCore = activeBtn && activeBtn.textContent.trim() === 'Core';

    if (isSebastian && isActiveTeamCore) {
      bogaClickCount++;

      // Trigger click animation on Sebastian's avatar
      img.classList.add('sebi-click-animation');
      setTimeout(() => {
        img.classList.remove('sebi-click-animation');
      }, 300);

      if (bogaClickCount >= requiredClicks) {
        triggerWololoEffect();
      }
    }
  });
});
