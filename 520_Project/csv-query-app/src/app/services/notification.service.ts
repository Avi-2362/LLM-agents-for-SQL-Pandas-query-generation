import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showErrorNotification(message: string, duration: number = 5000, action='Close') {
    this.showNotification(message, action, duration, 'error-snackbar');
  }

  showSuccessNotification(message: string, duration: number = 5000, action='Close') {
    this.showNotification(message, action, duration, 'success-snackbar');
  }

  showNotification(message: string, action: string = 'Close', duration: number = 5000, pClass: string = 'error-snackbar'): void {
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: pClass
    });
  }
}
