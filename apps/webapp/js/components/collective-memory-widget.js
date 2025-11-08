/**
 * Widget memoria collettiva
 * Mostra memorie rilevate durante la conversazione
 */
/* global document, window, setTimeout */

export class CollectiveMemoryWidget {
  constructor() {
    this.container = null;
    this.memories = [];
    this.init();
  }

  init() {
    // Crea container se non esiste
    if (!document.getElementById('collective-memory-widget')) {
      this.container = document.createElement('div');
      this.container.id = 'collective-memory-widget';
      this.container.className = 'collective-memory-widget';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('collective-memory-widget');
    }

    // Ascolta eventi
    if (window.collectiveMemoryBus) {
      window.collectiveMemoryBus.on('memory_stored', (data) => {
        this.addMemory(data);
      });

      window.collectiveMemoryBus.on('preference_detected', (data) => {
        this.showPreference(data);
      });

      window.collectiveMemoryBus.on('milestone_detected', (data) => {
        this.showMilestone(data);
      });

      window.collectiveMemoryBus.on('relationship_updated', (data) => {
        this.showRelationship(data);
      });
    }
  }

  addMemory(memory) {
    this.memories.push(memory);
    this.render();
  }

  showPreference(data) {
    // Toast elegante per preferenza rilevata
    this.showToast({
      type: 'preference',
      icon: '⭐',
      title: 'Preferenza memorizzata',
      message: `${data.member || 'Utente'}: ${data.preference || data.content || 'Preferenza rilevata'}`,
      category: data.category,
    });
  }

  showMilestone(data) {
    // Toast per milestone
    this.showToast({
      type: 'milestone',
      icon: '🎉',
      title: 'Milestone rilevata',
      message: data.message || data.content || 'Evento importante rilevato',
      date: data.date,
    });
  }

  showRelationship(data) {
    // Toast per relazione
    this.showToast({
      type: 'relationship',
      icon: '🤝',
      title: 'Relazione aggiornata',
      message: `${data.member_a || 'Membro 1'} ↔ ${data.member_b || 'Membro 2'}`,
      strength: data.strength,
    });
  }

  showToast(config) {
    const toast = document.createElement('div');
    toast.className = `collective-memory-toast collective-memory-toast--${config.type}`;
    toast.innerHTML = `
      <div class="toast-icon">${config.icon}</div>
      <div class="toast-content">
        <div class="toast-title">${config.title}</div>
        <div class="toast-message">${config.message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    this.container.appendChild(toast);

    // Auto-remove dopo 5 secondi
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  render() {
    // Render lista memorie (se richiesto)
    const list = this.container.querySelector('.memory-list');
    if (!list) return;

    list.innerHTML = this.memories
      .map(
        (m) => `
      <div class="memory-item memory-item--${m.category || 'work'}">
        <span class="memory-icon">${this.getIcon(m.category || 'work')}</span>
        <span class="memory-content">${m.content || ''}</span>
        <span class="memory-members">${m.members?.join(', ') || ''}</span>
      </div>
    `
      )
      .join('');
  }

  getIcon(category) {
    const icons = {
      work: '💼',
      personal: '👤',
      preference: '⭐',
      relationship: '🤝',
      milestone: '🎉',
      cultural: '🌏',
    };
    return icons[category] || '📝';
  }
}
