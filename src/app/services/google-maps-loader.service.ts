import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {

  private loadingPromise?: Promise<void>;

  load(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      // déjà chargé ?
      if ((window as any).google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      //  Mets ta vraie clé ici
      const apiKey = 'AIzaSyDPLZsTh4cya1n_CshNgzsH4OmKDLWK8xQ';
      script.src = 'https://maps.googleapis.com/maps/api/js?key='+apiKey;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject('Google Maps failed to load');

      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }
}
