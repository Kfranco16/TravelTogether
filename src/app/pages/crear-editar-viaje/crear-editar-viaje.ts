import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { TripService } from '../../core/services/viajes';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-crear-editar-viaje',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-editar-viaje.html',
  styleUrls: ['./crear-editar-viaje.css'],
})
export class CrearEditarViaje implements AfterViewInit {
  @ViewChild('destinationInput') destinationInput!: ElementRef;

  tripForm!: FormGroup;
  includesList = [
    'Alojamiento',
    'Comidas',
    'Guía turístico',
    'Entradas',
    'Seguro de viaje',
    'Transporte interno',
    'Vuelos',
    'Excursiones',
    'Traslados',
    'Visitas guiadas',
    'Material informativo',
    'Asistencia 24h',
  ];

  // NUEVO: variables para fotos
  selectedCoverPhoto: File | null = null;
  selectedMainPhoto: File | null = null;
  selectedGalleryPhotos: File[] = [];

  constructor(
    private fb: FormBuilder,
    private tripService: TripService, // tu propio servicio
    private http: HttpClient, // sólo si subes imágenes desde aquí
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.tripForm = this.fb.group({
      title: ['', Validators.required],
      origin: ['', Validators.required], // NUEVO
      destination: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      description: ['', Validators.required],
      itinerary: ['', [Validators.required, Validators.pattern(/^Dia/i)]],
      min_requirements: ['', Validators.required],
      includes: this.fb.array(this.includesList.map(() => false)),
      min_participants: ['', [Validators.required, Validators.min(1)]],
      estimated_cost: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      transport: ['', Validators.required],
      accommodation: ['', Validators.required],
      cover_photo: [null],
      main_photo: [null],
      gallery_photos: [null],
      latitude: [''],
      longitude: [''],
    });
  }

  async ngAfterViewInit() {
    // 1. Carga el script Maps solo si no está presente
    if (!(window as any).google || !(window as any).google.maps) {
      const script = document.createElement('script');
      // Sustituye TU_API_KEY por tu propia clave
      script.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyC0pfVObsIebW8emU07LbpXoMFuvJ2qWhc&libraries=places';
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }
    // 2. Usar la nueva API funcional: importLibrary
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
      } else if (controlName === 'main_photo') {
        this.selectedMainPhoto = files[0];
      }
      this.tripForm.get(controlName)?.setValue(files[0]);
    } else if (multiple && files.length <= 5) {
      this.selectedGalleryPhotos = Array.from(files);
      this.tripForm.get(controlName)?.setValue(files);
    }
  }
  // NUEVO submit con async/await y llamada al servicio
  async onSubmit() {
    if (!this.tripForm.valid) return;

    try {
      // Obtén el user_id desde AuthService o similar
      const user = JSON.parse(localStorage.getItem('usuario') || 'null');
      const userId = user ? user.id : null;
      // ej. this.authService.getCurrentUserId();

      // Construye el objeto con los datos del formulario

      const tripData = {
        origin: this.tripForm.value.origin || '', // asegúrate que el campo origin está en el formulario
        destination: this.tripForm.value.destination,
        title: this.tripForm.value.title,
        description: this.tripForm.value.description,
        creator_id: userId, // tu variable de usuario logueado
        start_date: this.tripForm.value.start_date + ' 00:00:00',
        end_date: this.tripForm.value.end_date + ' 00:00:00',
        estimated_cost: this.tripForm.value.estimated_cost,
        min_participants: this.tripForm.value.min_participants,
        transport: this.tripForm.value.transport,
        accommodation: this.tripForm.value.accommodation,
        itinerary: this.tripForm.value.itinerary,
        status: 'open', // puedes fijar el status si el backend lo requiere
        latitude: this.tripForm.value.latitude,
        longitude: this.tripForm.value.longitude,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      // 1. Crea el viaje llamando a tu servicio
      console.log('tripData:', tripData);

      const tripResponse = await this.tripService.createTrip(tripData);
      const tripId = tripResponse.trip.id;
      console.log('tripId:', tripId); // tras recibir respuesta al crear el viaje
      console.log('RESPUESTA VIAJE:', tripResponse);

      // 2. Sube imágenes por separado usando la API correctamente
      if (this.selectedCoverPhoto) {
        await this.tripService.uploadImage(
          this.selectedCoverPhoto,
          'Foto de portada',
          tripId,
          userId,
          false
        );
      }
      if (this.selectedMainPhoto) {
        await this.tripService.uploadImage(
          this.selectedMainPhoto,
          'Foto principal',
          tripId,
          userId,
          true
        );
      }
      for (const photo of this.selectedGalleryPhotos) {
        console.log('userId:', userId); // antes de subir la imagen
        await this.tripService.uploadImage(photo, 'Foto de galería', tripId, userId, false);
      }

      // OK: aquí mostrar feedback, resetear, etc.
      console.log('Viaje creado y fotos subidas');
    } catch (err) {
      console.error('Error al crear viaje o subir imágenes', err);
      if (err instanceof HttpErrorResponse) {
        console.error('Status:', err.status);
        console.error('StatusText:', err.statusText);
        console.error('URL:', err.url);
        console.error('Backend error:', err.error);
        // Puedes mostrar la razón al usuario si existe
        alert('Error: ' + (err.error?.message || JSON.stringify(err.error)));
      }
    }
  }
}
