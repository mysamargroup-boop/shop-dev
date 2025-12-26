// Lead Analytics Tracker
// Client-side tracking script for visitor behavior

interface LeadAnalyticsEvent {
  eventType: 'page_view' | 'click' | 'impression' | 'form_submit';
  elementSelector?: string;
  pageUrl: string;
  sessionId: string;
  userAgent: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

class LeadAnalyticsTracker {
  private sessionId: string;
  private apiEndpoint: string;
  private queue: LeadAnalyticsEvent[] = [];
  private isTracking: boolean = false;

  constructor() {
    this.sessionId = this.getSessionId();
    this.apiEndpoint = '/api/analytics';
    this.init();
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('lead_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('lead_session_id', sessionId);
    }
    return sessionId;
  }

  private init() {
    // Track page view on load
    this.trackPageView();
    
    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const selector = this.getElementSelector(target);
      
      // Track important clicks
      if (this.shouldTrackClick(target)) {
        this.trackEvent('click', selector);
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const target = e.target as HTMLFormElement;
      if (this.shouldTrackForm(target)) {
        this.trackEvent('form_submit', this.getElementSelector(target));
      }
    });

    // Track impressions (elements in viewport)
    this.trackImpressions();

    // Send queued events periodically
    setInterval(() => this.flushQueue(), 5000);
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }

  private shouldTrackClick(element: HTMLElement): boolean {
    // Track buttons, links, product cards, CTAs
    const trackableTags = ['BUTTON', 'A'];
    const trackableClasses = ['btn', 'cta', 'product-card', 'add-to-cart'];
    
    return trackableTags.includes(element.tagName) ||
           trackableClasses.some(cls => element.classList.contains(cls)) ||
           element.closest('[data-track="true"]') !== null;
  }

  private shouldTrackForm(element: HTMLFormElement): boolean {
    // Track subscription forms, contact forms, checkout forms
    return element.classList.contains('subscription-form') ||
           element.classList.contains('contact-form') ||
           element.id.includes('subscribe') ||
           element.id.includes('contact');
  }

  private trackPageView() {
    this.trackEvent('page_view', window.location.pathname);
  }

  private trackImpressions() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          if (element.dataset.track === 'impression') {
            this.trackEvent('impression', this.getElementSelector(element));
            observer.unobserve(element);
          }
        }
      });
    });

    // Observe elements with data-track="impression"
    document.querySelectorAll('[data-track="impression"]').forEach(el => {
      observer.observe(el);
    });
  }

  private trackEvent(eventType: LeadAnalyticsEvent['eventType'], elementSelector?: string) {
    const urlParams = new URLSearchParams(window.location.search);
    
    const event: LeadAnalyticsEvent = {
      eventType,
      elementSelector,
      pageUrl: window.location.pathname,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
    };

    this.queue.push(event);
  }

  private async flushQueue() {
    if (this.queue.length === 0 || this.isTracking) return;
    
    this.isTracking = true;
    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    } finally {
      this.isTracking = false;
    }
  }
}

// Initialize tracker
if (typeof window !== 'undefined') {
  new LeadAnalyticsTracker();
}
