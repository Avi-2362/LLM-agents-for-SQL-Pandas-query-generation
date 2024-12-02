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
  registerForm: FormGroup;
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
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirm_password: ['', [Validators.required]]
    });
  }

  // Handle login form submission
  onSubmit() {
    if (this.authForm.valid) {
      this.hashAndSendPasswordForLogin();
    }
  }

  // Handle user registration form submission
  onRegisterSubmit() {
    console.log("here...!");
    console.log(this.registerForm);
    if (this.registerForm.valid) {
      console.log("validated!!");
      const {email, password, confirm_password} = this.registerForm.value;
      if (password == confirm_password){
        console.log("password matched!!!")
        this.hashAndSendPasswordForRegister();
      }
      console.log(this.registerForm.value);
    }
  }
  // Hash the password and send it for registration
  async hashAndSendPasswordForRegister() {
    const {email, password, confirm_password} = this.registerForm.value;
    // Hash the password using CryptoJS
    const hashed_password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    console.log('Register:', email, hashed_password);
    // Send the email and hashed password to the backend for User Registration
    try {
      const response = await this.service.register(email, hashed_password).toPromise();
      // this.route.navigate(['dashboard']); // Navigate on successful login
      console.log(response);
      this.registerForm.reset();
      console.log("login now!!");
      this.toggleFlip();
    } catch (error) {
      console.error('Error logging in', error);
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
      this.route.navigate(['dashboard']); // Navigate on successful login
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
