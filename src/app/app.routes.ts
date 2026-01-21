import {AdminComponent} from './components/admin/admin.component';
import {CycloComponent} from './components/cyclo/cyclo.component';
import {HomeComponent} from './components/home/home.component';
import {GestionparcoursComponent} from './components/gestionparcours/gestionparcours.component';
import {GestionpointsComponent} from './components/gestionpoints/gestionpoints.component';
import {SimulationreelComponent} from './components/simulationreel/simulationreel.component';
import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: 'admin', component: AdminComponent},
  {path: 'cyclo', component: CycloComponent},
  {path: '', component: HomeComponent},
  {path: 'gestionparcours', component:GestionparcoursComponent},
  {path: 'gestionpoints', component:GestionpointsComponent},
  {path: 'simulationreel', component:SimulationreelComponent},

];
