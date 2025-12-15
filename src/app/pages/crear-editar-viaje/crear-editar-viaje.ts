import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TripService } from '../../core/services/viajes';
import { AuthService } from '../../core/services/auth';
import { Trip } from '../../interfaces/trip';
import { File } from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { lastValueFrom } from 'rxjs';

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

  apiErrorMessage: string | null = null;
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tripForm = this.fb.group(
      {
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
        min_participants: ['', [Validators.required, Validators.min(2), Validators.max(50)]],
        estimated_cost: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
        transport: ['', Validators.required],
        accommodation: ['', Validators.required],
        requirements: ['', Validators.required],
        cover_photo: [null],
        main_photo: [null],
        gallery_photos: [null],
        latitude: [''],
        longitude: [''],
      },
      {
        validators: [this.fechaNoPasadaValidator()],
      }
    );

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.modoEdicion = true;
        this.tripId = +id;
        this.cargarViaje(+id);
      }
    });
  }

  private fechaNoPasadaValidator() {
    return (group: FormGroup) => {
      const startCtrl = group.get('start_date');
      const endCtrl = group.get('end_date');

      if (!startCtrl || !endCtrl) return null;

      const startValue = startCtrl.value;
      const endValue = endCtrl.value;
      if (!startValue) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = new Date(startValue);
      const endDate = endValue ? new Date(endValue) : null;

      const errors: any = {};

      if (startDate.getTime() < today.getTime()) {
        errors.startInPast = true;
      }

      if (endDate && endDate.getTime() < today.getTime()) {
        errors.endInPast = true;
      }

      if (endDate && endDate.getTime() < startDate.getTime()) {
        errors.endBeforeStart = true;
      }

      const startHasError = errors.startInPast || errors.endBeforeStart;
      const endHasError = errors.endInPast || errors.endBeforeStart;

      if (startHasError) {
        startCtrl.setErrors({
          ...(startCtrl.errors || {}),
          dateError: true,
        });
      } else {
        if (startCtrl.errors) {
          const { dateError, ...rest } = startCtrl.errors;
          startCtrl.setErrors(Object.keys(rest).length ? rest : null);
        }
      }

      if (endHasError) {
        endCtrl.setErrors({
          ...(endCtrl.errors || {}),
          dateError: true,
        });
      } else {
        if (endCtrl.errors) {
          const { dateError, ...rest } = endCtrl.errors;
          endCtrl.setErrors(Object.keys(rest).length ? rest : null);
        }
      }

      return Object.keys(errors).length ? errors : null;
    };
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
    this.apiErrorMessage = null;

    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const user = JSON.parse(localStorage.getItem('usuario') || 'null');
    const userId = user ? user.id : null;

    const baseTripData: any = {
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
    };

    this.includesList.forEach((campo) => {
      baseTripData[campo] = this.tripForm.value[campo] ? 1 : 0;
    });

    try {
      await toast.promise(
        (async () => {
          if (this.modoEdicion && this.tripId) {
            await lastValueFrom(this.tripService.updateTrip(this.tripId, baseTripData));
            this.router.navigate(['/viaje', this.tripId]);
            return;
          }

          baseTripData.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const resp: any = await this.tripService.createTrip(baseTripData);
          const tripId = resp.trip?.id as number;

          if (this.selectedCoverPhoto) {
            try {
              await this.tripService.uploadImage(
                this.selectedCoverPhoto,
                'Foto de portada',
                tripId,
                resp.trip.creator_id,
                false
              );
            } catch (e) {
              console.error('Error subiendo portada:', e);
            }
          }

          if (this.selectedMainPhoto) {
            try {
              await this.tripService.uploadImage(
                this.selectedMainPhoto,
                'Foto principal',
                tripId,
                resp.trip.creator_id,
                true
              );
            } catch (e) {
              console.error('Error subiendo principal:', e);
            }
          }

          this.router.navigate(['/viaje', tripId]);
        })(),
        {
          loading: this.modoEdicion ? 'Actualizando viaje...' : 'Creando viaje...',
          success: () =>
            this.modoEdicion ? 'Viaje actualizado con éxito' : 'Viaje creado con éxito',
          error: 'Ha ocurrido un error al guardar el viaje',
        }
      );
    } catch (err) {
      let mensaje = 'Error al crear/actualizar viaje o subir imágenes';

      if (err instanceof HttpErrorResponse) {
        const backendMsg =
          (err.error && (err.error.message || err.error.error || err.error)) || err.message;

        const backendField = (err.error && err.error.field) as string | undefined;

        if (backendMsg) {
          mensaje = backendMsg;
          this.apiErrorMessage = backendMsg;
        }

        if (backendField && this.tripForm.get(backendField)) {
          const control = this.tripForm.get(backendField)!;
          control.setErrors({
            ...(control.errors || {}),
            serverError: backendMsg || 'Error en este campo',
          });
          control.markAsTouched();
        }

        console.error('Status:', err.status);
        console.error('StatusText:', err.statusText);
        console.error('URL:', err.url);
        console.error('Backend error:', err.error);
      }

      toast.error(mensaje);
    }
  }
}
