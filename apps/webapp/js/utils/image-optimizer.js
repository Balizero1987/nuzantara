// Image optimization and lazy loading utility
class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Initialize Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
    }

    // Auto-optimize images on page load
    this.optimizeExistingImages();
  }

  // Handle intersection for lazy loading
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  // Load image with fallback
  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
    };
    tempImg.onerror = () => {
      // Fallback to original if optimized version fails
      const fallback = img.dataset.fallback;
      if (fallback) {
        img.src = fallback;
        img.classList.add('loaded');
      }
    };
    tempImg.src = src;
  }

  // Optimize existing images
  optimizeExistingImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (this.observer) {
        this.observer.observe(img);
      } else {
        // Fallback for browsers without IntersectionObserver
        this.loadImage(img);
      }
    });
  }

  // Create optimized image element
  createOptimizedImage(src, alt = '', options = {}) {
    const img = document.createElement('img');
    img.alt = alt;
    img.loading = 'lazy'; // Native lazy loading
    
    // Add optimization classes
    img.classList.add('optimized-image');
    if (options.className) {
      img.classList.add(options.className);
    }

    // Set up progressive loading
    const optimizedSrc = this.getOptimizedSrc(src);
    if (optimizedSrc !== src) {
      img.dataset.src = optimizedSrc;
      img.dataset.fallback = src;
      img.src = this.getPlaceholder(options.width, options.height);
      
      if (this.observer) {
        this.observer.observe(img);
      } else {
        this.loadImage(img);
      }
    } else {
      img.src = src;
    }

    return img;
  }

  // Get optimized source URL
  getOptimizedSrc(src) {
    // For large images, try to use smaller versions
    if (src.includes('logo-day.jpeg')) {
      return src.replace('logo-day.jpeg', 'logo-day-optimized.webp');
    }
    if (src.includes('logo-night.jpeg')) {
      return src.replace('logo-night.jpeg', 'logo-night-optimized.webp');
    }
    
    // For other large images, add optimization suffix
    if (src.match(/\.(jpg|jpeg|png)$/i)) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '-optimized.webp');
    }
    
    return src;
  }

  // Generate placeholder
  getPlaceholder(width = 100, height = 100) {
    // Simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Loading...</text>
      </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }

  // Preload critical images
  preloadCriticalImages(urls) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

// CSS for smooth loading transitions
const imageOptimizerCSS = `
  .optimized-image {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .optimized-image.loaded {
    opacity: 1;
  }
  
  .optimized-image[data-src] {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading-shimmer 1.5s infinite;
  }
  
  @keyframes loading-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Inject CSS
if (!document.getElementById('image-optimizer-css')) {
  const style = document.createElement('style');
  style.id = 'image-optimizer-css';
  style.textContent = imageOptimizerCSS;
  document.head.appendChild(style);
}

export const imageOptimizer = new ImageOptimizer();