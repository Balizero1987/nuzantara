/**
 * Auto-Login Feature
 * Automatically redirects to chat if valid token exists
 */

(function() {
  // Skip if already on chat page (handle both /chat and /chat.html)
  const pathname = window.location.pathname;
  if (pathname.includes('/chat.html') || pathname.includes('/chat') || pathname.endsWith('/chat')) {
    return;
  }

  // Check for valid token
  const tokenData = localStorage.getItem('zantara-token');

  if (!tokenData) {
    return; // No token, show login page
  }

  try {
    const { token, expiresAt } = JSON.parse(tokenData);

    // Check if token is expired
    if (!token || !expiresAt || Date.now() >= expiresAt) {
      console.log('🔓 Token expired, clearing auth data');
      localStorage.removeItem('zantara-token');
      localStorage.removeItem('zantara-user');
      localStorage.removeItem('zantara-session');
      return;
    }

    // Token is valid - auto-login
    console.log('✅ Valid token found, auto-login...');

    // Show loading indicator (optional)
    document.body.innerHTML = `
      <div style="
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        color: #bfaa7e;
        font-family: system-ui;
        font-size: 1.125rem;
      ">
        <div style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">∞</div>
          <div>Auto-login...</div>
        </div>
      </div>
    `;

    // Redirect to chat
    setTimeout(() => {
      window.location.href = '/chat.html';
    }, 500);

  } catch (error) {
    console.error('❌ Auto-login error:', error);
    // Clear invalid data
    localStorage.removeItem('zantara-token');
  }
})();
