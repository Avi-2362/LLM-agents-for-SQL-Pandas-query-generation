import { Component, OnInit } from '@angular/core';
import { BackendService } from '../services/backend.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  providers: [BackendService],
  imports: [HttpClientModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit{
  user_id = '';
  is_logged_in = false;
  dropdownOpen = false;
  files: any[] = [{'file_id':'probs', 'name':'probs'}, {'file_id':'probs', 'name':'probs'}, {'file_id':'probs', 'name':'probs'}, {'file_id':'probs', 'name':'name'}]; // Array to store file data


  constructor(
    public service: BackendService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.service.isLoggedIn().subscribe(
      (response: any) => {
        this.user_id = response.user_id;
        this.is_logged_in = true;
        console.log(this.user_id, this.is_logged_in);
        // this.loadUserFiles();                      // call once structure is confirmed
      },
      (error) => {
        console.error('Access denied', error, this.is_logged_in);
      }
    );
  }

  loadUserFiles(): void {
    this.service.getUserFiles(this.user_id).subscribe(
      (response:any) => {
        this.files = response.files; // Assuming API returns a 'files' array
        console.log(this.files);
      },
      (error) => {
        console.error('Failed to load files:', error);
      }
    );
  }

  // Navigate to file operations page
  openFile(fileId: string): void {
    console.log("file id:", fileId);
    this.router.navigate(['/file', fileId]);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout() {
    console.log('Logging out...');
    // Add your logout logic here 
  }
}
