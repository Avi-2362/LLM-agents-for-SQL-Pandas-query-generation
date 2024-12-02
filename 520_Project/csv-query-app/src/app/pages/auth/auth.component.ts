import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as CryptoJS from 'crypto-js';
import { BackendService } from '../../services/backend.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  providers: [BackendService],
  standalone: true,
  imports: [ReactiveFormsModule, HttpClientModule],
})
export class AuthComponent {
  authForm: FormGroup;
  isFlipped: boolean = false; // Track flipping state for flip effect

  // Eye toggle states
  showLoginPassword: boolean = false;
  showRegisterPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    public service: BackendService,
    private http: HttpClient,
    private route: Router
  ) {
    // Initialize form group with validation
    this.authForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  // Handle login form submission
  onSubmit() {
    if (this.authForm.valid) {
      this.hashAndSendPasswordForLogin();
    }
  }

  // Hash the password and send it for login
  async hashAndSendPasswordForLogin() {
    const { email, password } = this.authForm.value;

    // Hash the password using CryptoJS
    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    console.log('Login:', email, hashedPassword);

    // Send the email and hashed password to the backend for login
    try {
      const response = await this.service.login(email, hashedPassword).toPromise();
      this.route.navigate(['file-upload']); // Navigate on successful login
    } catch (error) {
      console.error('Error logging in', error);
    }
  }

  // Toggle flipping state for flip effect
  toggleFlip() {
    this.isFlipped = !this.isFlipped;
  }

  // Methods for toggling password visibility
  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
