import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { TripService } from '../../core/services/viajes';
import { AuthService } from '../../core/services/auth';
import { Trip } from '../../interfaces/trip';

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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.tripForm = this.fb.group({
      title: ['', Validators.required],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      description: ['', Validators.required],
      itinerary: ['', [Validators.required, Validators.pattern(/^Dia/i)]],

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
    // 2.  API Places Autocomplete
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

  get includesFormArray() {
    return this.tripForm.get('includes') as FormArray;
  }

  onPhotoChange(event: any, controlName: string, multiple = false) {
    const files = event.target.files;
    if (!multiple && files.length > 0) {
      if (controlName === 'cover_photo') {
        this.selectedCoverPhoto = files[0];
        console.log('Archivo portada asignado:', this.selectedCoverPhoto);
      } else if (controlName === 'main_photo') {
        this.selectedMainPhoto = files[0];
        console.log('Archivo principal asignado:', this.selectedMainPhoto);
      }
      this.tripForm.get(controlName)?.setValue(files[0]);
    }
  }

  async onSubmit() {
    if (!this.tripForm.valid) return;

    try {
      const user = JSON.parse(localStorage.getItem('usuario') || 'null');
      const userId = user ? user.id : null;

      const tripData = {
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
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      this.includesList.forEach((campo) => {
        (tripData as any)[campo] = this.tripForm.value[campo] ? 1 : 0;
      });

      console.log('tripData:', tripData);

      const tripResponse = await this.tripService.createTrip(tripData);
      const tripId = tripResponse.trip.id;
      console.log('RESPUESTA VIAJE:', tripResponse);
      console.log('tripId:', tripId);
      console.log('selectedCoverPhoto:', this.selectedCoverPhoto);
      console.log('selectedMainPhoto:', this.selectedMainPhoto);

      try {
        if (this.selectedCoverPhoto) {
          await this.tripService.uploadImage(
            this.selectedCoverPhoto,
            'Foto de portada',
            tripResponse.trip.id,
            tripResponse.trip.creator_id,
            false
          );
          console.log('¡Portada subida correctamente!');
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
            tripResponse.trip.id,
            tripResponse.trip.creator_id,
            true
          );
          console.log('¡Principal subida correctamente!');
        }
      } catch (e) {
        console.error('Error subiendo principal:', e);
      }

      console.log('selectedCoverPhoto:', this.selectedCoverPhoto);
      console.log('selectedMainPhoto:', this.selectedMainPhoto);

      console.log('Foto portada:', this.selectedCoverPhoto);
      console.log('Foto principal:', this.selectedMainPhoto);

      console.log('Viaje creado y fotos subidas');
      alert('Viaje creado con éxito');
    } catch (err) {
      console.error('Error al crear viaje o subir imágenes', err);
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
