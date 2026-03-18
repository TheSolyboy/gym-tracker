import { WebHaptics } from 'web-haptics';

let instance: WebHaptics | null = null;

function getInstance() {
  if (typeof window === 'undefined') return null;
  if (!instance) instance = new WebHaptics();
  return instance;
}

export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  const h = getInstance();
  if (!h) return;

  switch (type) {
    case 'light':
      h.trigger([{ duration: 10, intensity: 0.4 }]);
      break;
    case 'medium':
      h.trigger([{ duration: 20, intensity: 0.6 }]);
      break;
    case 'heavy':
      h.trigger([{ duration: 40, intensity: 1.0 }]);
      break;
    case 'success':
      h.trigger([{ duration: 10, intensity: 0.5 }, { delay: 50, duration: 10, intensity: 0.8 }]);
      break;
    case 'error':
      h.trigger([{ duration: 40, intensity: 1.0 }, { delay: 30, duration: 40, intensity: 1.0 }]);
      break;
  }
}
