import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TripService } from '../../core/services/viajes';
import { AuthService } from '../../core/services/auth';
import { Trip } from '../../interfaces/trip';
import { File } from 'lucide-angular';

@Component({
  selector: 'app-crear-editar-viaje',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-editar-viaje.html',
  styleUrls: ['./crear-editar-viaje.css'],
})
export class CrearEditarViaje implements AfterViewInit {
  @ViewChild('destinationInput') destinationInput!: ElementRef;

  trip?: Trip;
  tripForm!: FormGroup;

  modoEdicion = false;
  tripId?: number;

  includesList = [
    'flights',
    'tickets',
    'visits',
    'full_board',
    'travel_insurance',
    'tour_guide',
    'informative_material',
    'breakfast',
    'visas',
    'assistance24',
  ];

  selectedCoverPhoto: File | null = null;
  selectedMainPhoto: File | null = null;

  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tripForm = this.fb.group({
      title: ['', Validators.required],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      description: ['', Validators.required],
      itinerary: ['', [Validators.required, Validators.pattern(/D[ií]a/i)]],

      flights: [false],
      tickets: [false],
      visits: [false],
      full_board: [false],
      travel_insurance: [false],
      tour_guide: [false],
      informative_material: [false],
      breakfast: [false],
      visas: [false],
      assistance24: [false],

      min_participants: ['', [Validators.required, Validators.min(1)]],
      estimated_cost: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      transport: ['', Validators.required],
      accommodation: ['', Validators.required],
      requirements: ['', Validators.required],
      cover_photo: [null],
      main_photo: [null],
      gallery_photos: [null],
      latitude: [''],
      longitude: [''],
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.modoEdicion = true;
        this.tripId = +id;
        this.cargarViaje(+id);
      }
    });
  }

  cargarViaje(id: number) {
    this.tripService.getTripById(id).then((trip: Trip) => {
      this.trip = trip;

      this.tripForm.patchValue({
        title: trip.title,
        origin: trip.origin,
        destination: trip.destination,
        start_date: trip.start_date?.slice(0, 10),
        end_date: trip.end_date?.slice(0, 10),
        description: trip.description,
        itinerary: trip.itinerary,
        requirements: trip.requirements,
        min_participants: trip.min_participants,
        estimated_cost: trip.estimated_cost,
        transport: trip.transport,
        accommodation: trip.accommodation,
        flights: !!trip.flights,
        tickets: !!trip.tickets,
        visits: !!trip.visits,
        full_board: !!trip.full_board,
        travel_insurance: !!trip.travel_insurance,
        tour_guide: !!trip.tour_guide,
        informative_material: !!trip.informative_material,
        breakfast: !!trip.breakfast,
        visas: !!trip.visas,
        assistance24: !!trip.assistance24,
        latitude: trip.latitude,
        longitude: trip.longitude,
      });
    });
  }

  async ngAfterViewInit() {
    // 1. API Google Maps
    if (!(window as any).google || !(window as any).google.maps) {
      const script = document.createElement('script');

      script.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyC0pfVObsIebW8emU07LbpXoMFuvJ2qWhc&libraries=places';
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }
    // 2. API Places Autocomplete
    const { Autocomplete } = await (window as any).google.maps.importLibrary('places');
    const autocomplete = new Autocomplete(this.destinationInput.nativeElement, {
      types: ['(cities)'],
      language: 'es',
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        this.tripForm.patchValue({
          latitude: lat,
          longitude: lng,
          destination: place.formatted_address || place.name,
        });
      }
    });
  }

  onPhotoChange(event: any, controlName: string, multiple = false) {
    const files = event.target.files;
    if (!multiple && files.length > 0) {
      if (controlName === 'cover_photo') {
        this.selectedCoverPhoto = files[0];
      } else if (controlName === 'main_photo') {
        this.selectedMainPhoto = files[0];
      }
      this.tripForm.get(controlName)?.setValue(files[0]);
    }
  }

  async onSubmit() {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('usuario') || 'null');
      const userId = user ? user.id : null;

      const baseTripData = {
        origin: this.tripForm.value.origin || '',
        destination: this.tripForm.value.destination,
        title: this.tripForm.value.title,
        description: this.tripForm.value.description,
        creator_id: userId,
        start_date: this.tripForm.value.start_date + ' 00:00:00',
        end_date: this.tripForm.value.end_date + ' 00:00:00',
        estimated_cost: this.tripForm.value.estimated_cost,
        min_participants: this.tripForm.value.min_participants,
        transport: this.tripForm.value.transport,
        accommodation: this.tripForm.value.accommodation,
        itinerary: this.tripForm.value.itinerary,
        requirements: this.tripForm.value.requirements,
        flights: this.tripForm.value.flights,
        tickets: this.tripForm.value.tickets,
        visits: this.tripForm.value.visits,
        full_board: this.tripForm.value.full_board,
        travel_insurance: this.tripForm.value.travel_insurance,
        tour_guide: this.tripForm.value.tour_guide,
        informative_material: this.tripForm.value.informative_material,
        breakfast: this.tripForm.value.breakfast,
        visas: this.tripForm.value.visas,
        assistance24: this.tripForm.value.assistance24,
        status: 'open',
        latitude: this.tripForm.value.latitude,
        longitude: this.tripForm.value.longitude,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      } as any;

      this.includesList.forEach((campo) => {
        baseTripData[campo] = this.tripForm.value[campo] ? 1 : 0;
      });

      let tripResponse;

      if (this.modoEdicion && this.tripId) {
        // EDICIÓN
        tripResponse = await this.tripService.updateTrip(this.tripId, baseTripData);
        alert('Viaje actualizado con éxito');
      } else {
        // CREAR NUEVO
        baseTripData.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        tripResponse = await this.tripService.createTrip(baseTripData);
        const tripId = tripResponse.trip.id;

        try {
          if (this.selectedCoverPhoto) {
            await this.tripService.uploadImage(
              this.selectedCoverPhoto,
              'Foto de portada',
              tripId,
              tripResponse.trip.creator_id,
              false
            );
          }
        } catch (e) {
          console.error('Error subiendo portada:', e);
        }

        await new Promise((res) => setTimeout(res, 2000));

        try {
          if (this.selectedMainPhoto) {
            await this.tripService.uploadImage(
              this.selectedMainPhoto,
              'Foto principal',
              tripId,
              tripResponse.trip.creator_id,
              true
            );
          }
        } catch (e) {
          console.error('Error subiendo principal:', e);
        }

        alert('Viaje creado con éxito');
      }

      // this.router.navigate(['/viaje', tripResponse.trip.id]);
    } catch (err) {
      console.error('Error al crear/actualizar viaje o subir imágenes', err);
      if (err instanceof HttpErrorResponse) {
        console.error('Status:', err.status);
        console.error('StatusText:', err.statusText);
        console.error('URL:', err.url);
        console.error('Backend error:', err.error);

        alert('Error: ' + (err.error?.message || JSON.stringify(err.error)));
      }
    }
  }
}
