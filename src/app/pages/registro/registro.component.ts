import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { RolService } from '../../services/rol.service';
import { Rol, ROL_DISPLAY } from '../../models/models';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule, MatDividerModule
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
    private toast: ToastService,
    private rolService: RolService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(2)]],
      apellido:        ['', [Validators.required, Validators.minLength(2)]],
      cedula:          ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      email:           ['', [Validators.required, Validators.email]],
      telefono:        [''],
      fechaNacimiento: [''],
      contrasenia:     ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  registrar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.cargando = true;

    const value = { ...this.form.value };
    if (value.fechaNacimiento) {
      const d = new Date(value.fechaNacimiento);
      value.fechaNacimiento = d.toISOString().split('T')[0];
    }

    
    this.http.post(`${environment.apiUrl}/responsables`, value).subscribe({
      next: () => {
        this.cargando = false;
        this.exito = true;
        this.cdr.detectChanges();
        this.toast.success('¡Cuenta creada exitosamente!');
      },
      error: (err) => {
        this.cargando = false;
        this.toast.error(err.error?.error || 'Error al registrarse. Intentá de nuevo.');
      }
    });
}

  getRolDisplay(nombre: string) { return ROL_DISPLAY[nombre] ?? nombre; }
  irLogin() { this.router.navigate(['/iniciarSesion']); }
}

