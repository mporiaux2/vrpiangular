import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElevationService {

  private elevator!: google.maps.ElevationService;

  constructor() {
    // Google Maps est chargé globalement
    this.elevator = new google.maps.ElevationService();
  }

  getElevation(lat: number, lng: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.elevator.getElevationForLocations(
        {
          locations: [{ lat, lng }]
        },
        (results, status) => {
          if (status === google.maps.ElevationStatus.OK && results?.length) {
            resolve(results[0].elevation);
          } else {
            reject(status);
          }
        }
      );
    });
  }
}
