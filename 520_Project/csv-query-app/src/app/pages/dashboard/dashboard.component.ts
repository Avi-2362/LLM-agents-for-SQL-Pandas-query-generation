import { Component, OnInit } from '@angular/core';
import { BackendService } from '../../services/backend.service';
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
export class DashboardComponent implements OnInit {
  user_id = '';
  is_logged_in = false;
  dropdownOpen = false;
  hoveredFileId: number | null = null;
  files: any[] = [
    { file_id: 'probs1', filename: 'File 1' }
  ]; // Placeholder data for file list

  constructor(
    public service: BackendService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.service.isLoggedIn().subscribe(
      (response: any) => {
        this.user_id = response.user_id || '';
        this.is_logged_in = true;
        console.log('User logged in:', this.user_id, this.is_logged_in);

        // Uncomment the following line once the backend structure is confirmed
        // this.loadUserFiles();
        this.service.data$.subscribe((updatedData) => {
          console.log(updatedData);
          this.loadUserFiles();
        });
      },
      (error) => {
        console.error('Access denied:', error);
        this.is_logged_in = false;
        // redirect to auth page
        this.router.navigate(['/auth']);
      }
    );
  }

  loadUserFiles(): void {
    this.service.getUserFiles(this.user_id).subscribe(
      (response: any) => {
        if (response && response.files) {
          this.files = response.files; // Assuming API returns a 'files' array
          console.log('Files loaded:', this.files);
        } else {
          console.warn('No files found for the user.');
        }
      },
      (error) => {
        console.error('Failed to load files:', error);
      }
    );
  }

  // Navigate to file operations page
  openFile(fileId: string): void {
    console.log('Navigating to file operations for file ID:', fileId);
    this.router.navigate(['/file', fileId]);
  }

  deleteFile(fileId: number, event: Event) {
    event.stopPropagation(); // Prevent click event on the file card
    this.files = this.files.filter((file) => file.file_id !== fileId);
    console.log(`File with ID ${fileId} deleted.`);
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    console.log('Dropdown state:', this.dropdownOpen);
  }

  logout(): void {
    
    this.service.logout().subscribe(
      (response: any) => {
        if (response && response.msg == "Logout successful") {
          
          console.log('Logged out...');
          this.is_logged_in = false;
          this.router.navigate(['/auth']);
        } else {
          console.warn('Error logging out');
        }
      },
      (error) => {
        console.error('Failed to logout:', error);
      }
    );
    
    
  }

  async uploadFile(file:any) {
    if (!file) return;

    try {
      const response: any = await this.service.getPresignedUploadUrl().toPromise();
      const presignedUrl = response?.url;
      const file_id = response?.file_id;
      console.log(presignedUrl);
      console.log(file_id);
      if (presignedUrl) {
        await this.service.uploadFileToS3(file, presignedUrl).toPromise();
        console.log('File uploaded successfully');
        // after uploading to S3, call the backend api to upload new file to a user
        const file_data = {
          filename: file.name,
          file_id: file_id
        }
        const resp:any = await this.service.addFileToUser(file_data).toPromise();
        console.log("response", resp);
        this.service.updateData("files"); // can be any string
        // this.files = resp?.files;
        // console.log(this.files);
      }
    } catch (error) {
      console.error('Error uploading file', error);
    }
  }

  async handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('File uploaded:', file.name);
      try{
        await this.uploadFile(file);

      }
      catch (error)
      {
        console.error('Error uploading file', error);
      }
      // Make sure that you save file meta data in backend if uploaded sucessufylly 
    }
  }
  
}
