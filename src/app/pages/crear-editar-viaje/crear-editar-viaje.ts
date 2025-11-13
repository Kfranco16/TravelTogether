import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-crear-editar-viaje',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-editar-viaje.html',
  styleUrls: ['./crear-editar-viaje.css'],
})
export class CrearEditarViaje implements AfterViewInit {
  @ViewChild('destinationInput') destinationInput!: ElementRef;

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

  constructor(private fb: FormBuilder) {}

  get includesFormArray() {
    return this.tripForm.get('includes') as FormArray;
  }

  onPhotoChange(event: any, controlName: string, multiple = false) {
    const files = event.target.files;
    if (!multiple) {
      this.tripForm.get(controlName)?.setValue(files[0]);
    } else if (files.length <= 5) {
      this.tripForm.get(controlName)?.setValue(files);
    }
  }
  onSubmit() {
    if (this.tripForm.valid) {
      console.log(this.tripForm.value);
      // Aquí puedes hacer el POST o PATCH a tu API
    }
  }

  ngOnInit(): void {
    this.tripForm = this.fb.group({
      title: ['', Validators.required],
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
}
