// streetview-maps.service.ts
import { Injectable, NgZone } from '@angular/core';

declare global {
  interface Window {
    initializeStreetView: () => void;
    google: any;
  }
}

@Injectable({ providedIn: 'root' })
export class StreetViewMapsService {
  private scriptLoadingPromise?: Promise<void>;
  private elevator?: google.maps.ElevationService;

  constructor(private zone: NgZone) {}

  load(apiKey: string): Promise<void> {
    if (this.scriptLoadingPromise) return this.scriptLoadingPromise;

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      // callback global exigé par Google si on passe ?callback=
      window.initializeStreetView = () => {
        // on repasse dans la zone Angular si besoin
        this.zone.run(() => resolve());
      };

      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initializeStreetView`;

      script.onload = () => {
        // le resolve se fera via le callback initializeStreetView
        // (on le laisse tel quel pour rester cohérent avec ?callback=)
      };

      script.onerror = () => reject(new Error('Erreur de chargement Google Maps'));

      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  createPanorama(el: HTMLElement, position: { lat: number; lng: number }, heading: number) {
    return new window.google.maps.StreetViewPanorama(el, {
      position,
      pov: { heading, pitch: 0 },
      zoom: 1,
    });
  }
  createMap(
    el: HTMLElement,
    options: {
      center: { lat: number; lng: number };
      zoom?: number;
      tilt?: number;
      mapTypeId?: google.maps.MapTypeId | string;
      heading?: number;
      mapId?: string;
    }
  ) {
    return new window.google.maps.Map(el, {
      center: options.center,
      zoom: options.zoom ?? 22,
      tilt: options.tilt ?? 0,
      mapTypeId: options.mapTypeId ?? 'roadmap',
      heading: options.heading ?? 0,
      mapId: options.mapId,
    });
  }
  private getElevator(): google.maps.ElevationService {
    if (!this.elevator) this.elevator = new google.maps.ElevationService();
    return this.elevator;
  }

  getElevationAt(position: any): Promise<number> {
    const elevator = this.getElevator();

    return new Promise<number>((resolve, reject) => {
      elevator.getElevationForLocations({ locations: [position] }, (results, status) => {
        if (status === 'OK' && results && results[0]) resolve(results[0].elevation);
        else reject(new Error('Elevation status=' + status));
      });
    });
  }

  cleanupGlobalCallback() {
    delete (window as any).initializeStreetView;
  }
}
