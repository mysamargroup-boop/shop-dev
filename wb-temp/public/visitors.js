
// Lead Analytics Tracker - Client-side tracking script
(function() {
  if (typeof window === 'undefined') return;

  class LeadAnalyticsTracker {
    constructor() {
      this.queue = [];
      this.isTracking = false;
      this.sessionId = this.getSessionId();
      this.apiEndpoint = 'https://atauvytuspdpwkzhilkb.supabase.co/functions/v1/analytics-ingest';
      this.init();
    }

    getSessionId() {
      let sessionId = sessionStorage.getItem('lead_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('lead_session_id', sessionId);
      }
      return sessionId;
    }

    init() {
      // Avoid running on admin pages
      if (window.location.pathname.startsWith('/wb-admin')) return;

      this.trackPageView();
      document.addEventListener('click', (e) => this.handleInteraction(e, 'click'));
      document.addEventListener('submit', (e) => this.handleInteraction(e, 'form_submit'));
      this.trackImpressions();
      setInterval(() => this.flushQueue(), 5000);
      window.addEventListener('beforeunload', () => this.flushQueue());
    }

    getElementSelector(element) {
        if (!element) return '';
        if (element.id) return `#${element.id}`;
        if (element.dataset.trackId) return `[data-track-id="${element.dataset.trackId}"]`;
        let selector = element.tagName.toLowerCase();
        if (element.className) {
            selector += `.${element.className.split(' ').join('.')}`;
        }
        return selector;
    }

    shouldTrack(element, eventType) {
        if (!element) return false;
        
        // Don't track clicks inside the admin preview bar, etc.
        if (element.closest('[data-no-track]')) return false;

        if (eventType === 'click') {
            const trackableTags = ['BUTTON', 'A'];
            const trackableClasses = ['cta', 'product-card', 'add-to-cart'];
            return trackableTags.includes(element.tagName) ||
                   trackableClasses.some(cls => element.classList.contains(cls)) ||
                   element.closest('[data-track-click="true"]') !== null;
        }

        if (eventType === 'form_submit') {
             return element.closest('[data-track-submit="true"]') !== null;
        }
        
        return false;
    }
    
    handleInteraction(e, eventType) {
        if (this.shouldTrack(e.target, eventType)) {
            const selector = this.getElementSelector(e.target);
            this.trackEvent(eventType, selector);
        }
    }


    trackPageView() {
      this.trackEvent('page_view');
    }

    trackImpressions() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const selector = this.getElementSelector(element);
            this.trackEvent('impression', selector);
            observer.unobserve(element);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('[data-track-impression="true"]').forEach(el => observer.observe(el));
    }

    trackEvent(eventType, elementSelector) {
      const urlParams = new URLSearchParams(window.location.search);
      const event = {
        eventType,
        elementSelector: elementSelector || undefined,
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

    async flushQueue() {
      if (this.queue.length === 0 || this.isTracking) return;

      this.isTracking = true;
      const events = [...this.queue];
      this.queue = [];

      try {
        await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
          keepalive: true,
        });
      } catch (error) {
        // Re-queue on failure if it's not a beacon-related error
        if (error.name !== 'AbortError') {
            this.queue.unshift(...events);
        }
      } finally {
        this.isTracking = false;
      }
    }
  }

  // Self-initialize
  new LeadAnalyticsTracker();
})();
