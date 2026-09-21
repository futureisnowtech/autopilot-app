import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Initializes native Capacitor event listeners for app resume and deep linking (OAuth redirects)
 */
export const initCapacitorListeners = (onDeepLink?: (url: string) => void) => {
  if (!isNativePlatform()) return;

  // Configure Status Bar style
  try {
    StatusBar.setStyle({ style: Style.Dark });
  } catch (err) {
    console.warn('StatusBar configuration notice:', err);
  }

  // Handle mobile app URL open (e.g. com.autopilot.app://auth/callback)
  App.addListener('appUrlOpen', (event) => {
    try {
      const url = new URL(event.url);
      if (onDeepLink) {
        onDeepLink(event.url);
      } else if (url.pathname) {
        window.location.href = url.pathname + url.search + url.hash;
      }
    } catch (e) {
      console.error('Error handling deep link:', e);
    }
  });
};

/**
 * Safely open external link via Capacitor Browser in native apps
 */
export const openExternalUrl = async (url: string) => {
  if (isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
