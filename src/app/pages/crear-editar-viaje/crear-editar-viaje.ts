import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';

@Component({
  selector: 'app-crear-editar-viaje',
  imports: [ReactiveFormsModule],
  templateUrl: './crear-editar-viaje.html',
  styleUrls: ['./crear-editar-viaje.css'],
})
export class CrearEditarViaje {
  registroForm: FormGroup;

  get incluye(): FormArray {
    return this.registroForm.get('incluye') as FormArray;
  }

  get noIncluye(): FormArray {
    return this.registroForm.get('noIncluye') as FormArray;
  }

  constructor(private fb: FormBuilder) {
    this.registroForm = this.fb.group({
      incluye: this.fb.array(this.initItems()),
      noIncluye: this.fb.array(this.initItems()),
      // aquí puedes añadir otros campos del formulario
    });
  }

  // Genera 6 espacios vacíos para cada lista
  private initItems(): any[] {
    return Array(6)
      .fill('')
      .map(() => this.fb.control('', Validators.maxLength(50)));
  }

  enviar() {
    if (this.registroForm.valid) {
      console.log(this.registroForm.value);
      // aquí tu lógica de envío (API, etc)
    }
  }
}
