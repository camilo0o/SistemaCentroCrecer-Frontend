import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {

  username = '';
  password = '';

  constructor(private authService: AuthService) {}

  login() {
    this.authService.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.authService.saveToken(res.token);
        console.log('Login OK');
      },
      error: () => {
        console.log('Error login');
      }
    });
  }
}