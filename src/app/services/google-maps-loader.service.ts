import {ChangeDetectorRef, Injectable, NgZone} from '@angular/core';
import {ValeursService} from './valeurs.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {

  private loadingPromise?: Promise<void>;
  private googleMapsScriptLoaded: boolean=false;
  private elevator: any;
  private  apiKey;

  constructor(private valeursService:ValeursService){
    this.apiKey = this.valeursService.apiKey;
  }

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

      script.src = 'https://maps.googleapis.com/maps/api/js?key='+this.apiKey;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject('Google Maps failed to load');

      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }


  private loadGoogleMapsScript(): void {
    if (this.googleMapsScriptLoaded) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;

    //  Mets ta vraie clé ici
    //const apiKey = 'AIzaSyAuy-eGBKO_RzCDakQt66MGEphU73g2lBo';

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&callback=initializeStreetView`;


    script.onload = () => {
      console.log('Google Maps script chargé');
      this.googleMapsScriptLoaded = true;
      if (!this.elevator) {
        this.elevator = new google.maps.ElevationService();
      }
    };

    script.onerror = () => {
      console.error('Erreur de chargement Google Maps');
    };

    document.head.appendChild(script);
  }
}
