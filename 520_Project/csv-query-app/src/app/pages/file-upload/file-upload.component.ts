import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BackendService } from '../../services/backend.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as XLSX from 'xlsx'; // Import XLSX for parsing Excel/CSV files
import { Router, ActivatedRoute } from '@angular/router';
import { VoiceService } from '../../services/voice.service';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';   // Import SQL grammar



interface ChatMessage {
  text: string;
  isUser: boolean;
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  standalone: true,
  providers: [BackendService],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
})
export class FileUploadComponent implements OnInit {
  chatQuery = '';
  user_id = '';
  is_logged_in = false;
  file_id: any;

  // New properties for header dropdown functionality
  dropdownOpen = false;

  // Add chatMessages property
  chatMessages: ChatMessage[] = [];

  // python code
  pythonCode: string  = `
def greet(name):
    print(f"Hello, {name}!")

greet("World")
  `;
  sqlQuery: string = `SELECT * FROM TABLE;`
  highlightedCode: string = '';

  constructor(
    private fb: FormBuilder,
    public service: BackendService,
    private router: Router,
    private route: ActivatedRoute,
    private speechRecognitionService: VoiceService,
    private http: HttpClient
  ) {
    this.fileForm = this.fb.group({
      file: [null],
    });
  }

  ngOnInit(): void {
    this.service.isLoggedIn().subscribe(
      (response: any) => {
        this.user_id = response.user_id;
        this.is_logged_in = true;
        console.log(this.user_id, this.is_logged_in);
        this.file_id = this.route.snapshot.paramMap.get('id');
        this.parseFileFromUrl();

        this.service.dataPython$.subscribe((updatedData) => {
          console.log(updatedData);
          if (this.queryType=="Pandas"){
            this.highlightedCode = Prism.highlight(this.pythonCode, Prism.languages['python'], 'python');
          }
          else {
            this.highlightedCode = Prism.highlight(this.sqlQuery, Prism.languages['sql'], 'sql');
          }
          
        })
      },
      (error) => {
        console.error('Access denied', error, this.is_logged_in);
        // redirect to auth page
        this.router.navigate(['/auth']);
      }
    );

  }

  async onChatSubmit() {
    if (this.chatQuery.trim()) {
      // Add user message to chatMessages
      this.chatMessages.push({ text: this.chatQuery, isUser: true });

      // Simulate a bot response
      const botResponse = `Received your query: ${this.chatQuery}`;
      this.chatMessages.push({ text: botResponse, isUser: false });

      // Clear the chat input
      this.chatQuery = '';
    }

    this.query = this.chatQuery;
    await this.onSubmitQuery();
  }

  file: File | undefined;
  fileForm: FormGroup;
  fileData: any = null;
  queryResult: any = null;
  query = '';
  chatbotResponse = '';
  isResultTable = false;
  data: any[] = []; // To hold parsed table data
  headers: string[] = []; // To hold table headers

  // New properties for CSV Preview
  csvData: any[] = [];
  cols: string[] = [];


  async parseFileFromUrl() {
    const resp:any = await this.service.getPresignedDownloadUrl(this.file_id).toPromise();
    const url = resp?.url;
    console.log(url);
    this.http.get(url, { responseType: 'arraybuffer' }).subscribe({
      next: (fileData) => {
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        if (Array.isArray(jsonData)) {
          const maxRows = 50; // Limit rows to prevent rendering large files
          const maxCols = 50; // Limit columns to prevent rendering large files

          this.cols = jsonData[0]?.slice(0, maxCols) || [];
          this.csvData = jsonData.slice(1, maxRows).map((row: any[]) =>
            this.cols.reduce((acc: any, col: string, index: number) => {
              acc[col] = row[index] || '';
              return acc;
            }, {})
          );

          console.log('Columns:', this.cols);
          console.log('CSV Data:', this.csvData);
        } else {
          console.error('Invalid data format');
        }
      },
      error: (err) => {
        console.error('Error fetching file:', err);
      },
    });
  }

  async onSubmitQuery() {
    console.log("called onSubmitQuery");
    if (this.query) {
      console.log('Query submitted:', this.query);
      try {
        if (true) {
          if (this.queryType=="Pandas"){
            this.service.getPandasQueryOutput(this.file_id, this.query, 'default').subscribe({
              next: (response: any) => {
                console.log(response);
                const result = JSON.parse(response['result']);
                this.queryResult = response['query'];
                this.pythonCode = this.queryResult;
                this.service.updateDataPython("python");
                this.headers = Object.keys(result);
                this.isResultTable = response['is_table'];
  
                const rows = Object.keys(result[this.headers[0]]);
                this.data = rows.map((rowId) => {
                  let row: any = {};
                  this.headers.forEach((header) => {
                    row[header] = result[header][rowId];
                  });
                  return row;
                });
              },
              error: (error) => {
                console.error('Error sending the query', error);
              },
            });
          } else {
            this.service.getSqlQueryOutput(this.file_id, this.query, 'default').subscribe({
              next: (response: any) => {
                console.log(response);
                const result = JSON.parse(response['result']);
                this.queryResult = response['query'];
                this.sqlQuery = this.queryResult;
                this.service.updateDataPython("sql");
                this.headers = Object.keys(result);
                this.isResultTable = response['is_table'];
  
                const rows = Object.keys(result[this.headers[0]]);
                this.data = rows.map((rowId) => {
                  let row: any = {};
                  this.headers.forEach((header) => {
                    row[header] = result[header][rowId];
                  });
                  return row;
                });
              },
              error: (error) => {
                console.error('Error sending the query', error);
              },
            });
          }
          
        } else {
          console.log('No file found!!');
        }
      } catch (error) {
        console.error('Unexpected error in query submission', error);
      }

      // this.queryResult = `Results for query: ${this.query}`;
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
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

  queryType: string = 'SQL'; // Default to 'Pandas'

  startVoiceInput(): void {
    if (!this.speechRecognitionService.isListening) {
      this.speechRecognitionService.startListening((text: string) => {
        this.query += ` ${text}`;
      });
    }
  }

  stopVoiceInput(): void {
    this.speechRecognitionService.stopListening();
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.pythonCode).then(() => {
      alert('Code copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }

  onQueryTypeChange(selectedType: string): void {
    console.log('Query Type changed to:', selectedType);
    this.service.updateDataPython(selectedType);
    // Add additional logic here as needed
  }

}
