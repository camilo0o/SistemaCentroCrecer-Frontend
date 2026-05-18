import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatStepperModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})

export class RegistroComponent implements OnInit {
  form!: FormGroup;
  cargando = false;
  exito = false;
  mostrarPass = false;
 
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService
  ) {}
 
  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      fechaNacimiento: [''],
      contrasenia: ['', [Validators.required, Validators.minLength(8)]]
    });
  }
 
  registrar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.cargando = true;
    const datos = this.form.value;
    this.http.post(`${environment.apiUrl}/responsables`, datos).subscribe({
      next: () => {
        this.cargando = false;
        this.exito = true;
        this.toast.success('¡Cuenta creada exitosamente!');
      },
      error: (err) => {
        this.cargando = false;
        this.toast.error(err.error?.error || 'Error al registrarse. Intentá de nuevo.');
      }
    });
  }
 
  irLogin() { this.router.navigate(['/iniciarSesion']); }

}