// ========================================
// BALI ZERO WORKSPACE - JAVASCRIPT
// Powered by ZANTARA AI
// ========================================

// ========================================
// THEME TOGGLE (Dark/Light Mode)
// ========================================

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light-mode';
body.className = savedTheme;

// Toggle theme
themeToggle.addEventListener('click', () => {
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light-mode');
    }
});

// ========================================
// COMMAND PALETTE (Cmd+K / Ctrl+K)
// ========================================

const commandPalette = document.getElementById('commandPalette');
const commandInput = document.getElementById('commandInput');
const searchTrigger = document.getElementById('searchTrigger');

// Open command palette
function openCommandPalette() {
    commandPalette.classList.add('active');
    commandInput.focus();
}

// Close command palette
function closeCommandPalette() {
    commandPalette.classList.remove('active');
    commandInput.value = '';
}

// Keyboard shortcut: Cmd+K or Ctrl+K
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
    }
    
    // ESC to close
    if (e.key === 'Escape' && commandPalette.classList.contains('active')) {
        closeCommandPalette();
    }
});

// Click on search trigger
searchTrigger.addEventListener('click', openCommandPalette);

// Click outside to close
commandPalette.addEventListener('click', (e) => {
    if (e.target === commandPalette) {
        closeCommandPalette();
    }
});

// Command palette search functionality
commandInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const commandItems = document.querySelectorAll('.command-item');
    
    commandItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
});

// Command item click handlers
document.querySelectorAll('.command-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.textContent.trim();
        console.log('Command executed:', action);
        closeCommandPalette();
        
        // Show notification
        showNotification(`Action: ${action}`, 'success');
    });
});

// ========================================
// SIDEBAR TOGGLE (Mobile)
// ========================================

const sidebar = document.getElementById('sidebar');
let sidebarOpen = false;

// Create hamburger menu for mobile
const hamburger = document.createElement('button');
hamburger.className = 'hamburger-menu';
hamburger.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
`;
hamburger.style.cssText = `
    display: none;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-sm);
    transition: all var(--transition-fast);
`;

// Add hamburger to header
const headerLeft = document.querySelector('.header-left');
headerLeft.insertBefore(hamburger, headerLeft.firstChild);

// Toggle sidebar on mobile
hamburger.addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    if (sidebarOpen) {
        sidebar.classList.add('open');
    } else {
        sidebar.classList.remove('open');
    }
});

// Show hamburger on mobile
function checkMobile() {
    if (window.innerWidth <= 768) {
        hamburger.style.display = 'flex';
    } else {
        hamburger.style.display = 'none';
        sidebar.classList.remove('open');
        sidebarOpen = false;
    }
}

window.addEventListener('resize', checkMobile);
checkMobile();

// ========================================
// NOTIFICATIONS SYSTEM
// ========================================

function showNotification(message, type = 'info') {
    // Create notification container if doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 24px;
            z-index: 1001;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        padding: 16px 20px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    // Icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <span style="font-size: 20px;">${icons[type] || icons.info}</span>
        <span style="flex: 1; font-size: 14px; color: var(--text-primary);">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 20px;">×</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .hamburger-menu:hover {
        background: var(--bg-hover);
    }
`;
document.head.appendChild(style);

// ========================================
// PROJECT CARDS INTERACTIONS
// ========================================

document.querySelectorAll('.project-card').forEach(card => {
    // Skip add card
    if (card.classList.contains('project-card-add')) {
        card.addEventListener('click', () => {
            showNotification('Create new project feature coming soon!', 'info');
        });
        return;
    }
    
    // Hover effect enhancement
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-6px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
    
    // Click to view project
    card.addEventListener('click', () => {
        const projectName = card.querySelector('h3').textContent;
        showNotification(`Opening ${projectName}...`, 'info');
    });
});

// ========================================
// WIDGET MENU INTERACTIONS
// ========================================

document.querySelectorAll('.widget-menu').forEach(menu => {
    menu.addEventListener('click', (e) => {
        e.stopPropagation();
        showNotification('Widget menu coming soon!', 'info');
    });
});

// ========================================
// NAVIGATION ITEMS INTERACTIONS
// ========================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active from all
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        // Add active to clicked
        item.classList.add('active');
        
        const pageName = item.querySelector('span').textContent;
        showNotification(`Navigating to ${pageName}...`, 'info');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarOpen = false;
        }
    });
});

// ========================================
// HERO ACTION BUTTONS
// ========================================

document.querySelectorAll('.hero-actions .btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.textContent.trim();
        showNotification(`${action} feature coming soon!`, 'info');
    });
});

// ========================================
// USER AVATAR MENU
// ========================================

const userAvatar = document.querySelector('.user-avatar');
let userMenuOpen = false;

userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Create or toggle user menu
    let userMenu = document.querySelector('.user-dropdown');
    
    if (userMenu) {
        userMenu.remove();
        userMenuOpen = false;
        return;
    }
    
    userMenu = document.createElement('div');
    userMenu.className = 'user-dropdown';
    userMenu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        box-shadow: var(--shadow-lg);
        min-width: 200px;
        padding: 8px;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
    `;
    
    userMenu.innerHTML = `
        <div style="padding: 12px; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 600; color: var(--text-primary);">Zero</div>
            <div style="font-size: 12px; color: var(--text-secondary);">zero@balizero.com</div>
        </div>
        <button class="user-menu-item" style="width: 100%; text-align: left; padding: 10px 12px; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; transition: all 0.2s;">Profile</button>
        <button class="user-menu-item" style="width: 100%; text-align: left; padding: 10px 12px; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; transition: all 0.2s;">Settings</button>
        <button class="user-menu-item" style="width: 100%; text-align: left; padding: 10px 12px; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 6px; transition: all 0.2s;">Help</button>
        <div style="border-top: 1px solid var(--border-color); margin: 4px 0;"></div>
        <button class="user-menu-item" style="width: 100%; text-align: left; padding: 10px 12px; background: none; border: none; color: var(--bali-red-energy); cursor: pointer; border-radius: 6px; transition: all 0.2s;">Logout</button>
    `;
    
    document.querySelector('.user-menu').style.position = 'relative';
    document.querySelector('.user-menu').appendChild(userMenu);
    userMenuOpen = true;
    
    // Menu item hover
    userMenu.querySelectorAll('.user-menu-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = 'var(--bg-hover)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
        item.addEventListener('click', () => {
            showNotification(`${item.textContent} coming soon!`, 'info');
            userMenu.remove();
            userMenuOpen = false;
        });
    });
});

// Close user menu on outside click
document.addEventListener('click', () => {
    const userMenu = document.querySelector('.user-dropdown');
    if (userMenu && userMenuOpen) {
        userMenu.remove();
        userMenuOpen = false;
    }
});

// ========================================
// SMOOTH SCROLL
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// LOTUS ANIMATION (Hero Section)
// ========================================

const lotusAnimation = document.querySelector('.lotus-animate');
if (lotusAnimation) {
    // Add breathing animation
    setInterval(() => {
        lotusAnimation.style.animation = 'float 3s ease-in-out infinite';
    }, 100);
}

// ========================================
// LOADING STATE
// ========================================

window.addEventListener('load', () => {
    // Hide any loading overlay
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 300);
    }
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('Welcome to Bali Zero Workspace! 🌸', 'success');
    }, 500);
});

// ========================================
// CONSOLE WELCOME MESSAGE
// ========================================

console.log('%c🌸 Bali Zero Workspace', 'font-size: 20px; font-weight: bold; color: #6B4FA8;');
console.log('%cPowered by ZANTARA AI', 'font-size: 14px; color: #4FD1C5;');
console.log('%cDesigned with ❤️ by Claude Sonnet 4.5', 'font-size: 12px; color: #666;');

// ========================================
// KEYBOARD SHORTCUTS INFO
// ========================================

console.log('\n%cKeyboard Shortcuts:', 'font-weight: bold;');
console.log('Cmd/Ctrl + K: Open Command Palette');
console.log('ESC: Close Command Palette');
console.log('\n');

// ========================================
// DEVELOPMENT HELPERS
// ========================================

// Log theme changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            const theme = body.classList.contains('dark-mode') ? 'Dark' : 'Light';
            console.log(`🎨 Theme changed to: ${theme} Mode`);
        }
    });
});

observer.observe(body, { attributes: true });

// ========================================
// END OF SCRIPT
// ========================================
