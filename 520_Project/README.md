# LLM-Powered Query Processing for CSVs

This is a web-based tool to translate natural language inputs into SQL/Pandas queries for data analysis. Our tool aims to simplify complex data operations for non-technical users and to streamline workflows for data analysts.

---

## Contents
- [High Level Features](#high-level-features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [Environment Variables](#environment-variables)
- [Running](#running)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Unit Testing](#unit-testing)
- [AI Models](#ai-models)

---

## High Level Features  
- **User Authentication**: Users can register and login to the application
- **Natural Language Interface**: Accepts queries natural language queries in englist, through text and voice based inputs.  
- **User Spaces**: User can view all his uploaded csv files, upload new file, delete existing files.
- **Query Generation**: Converts user inputs into SQL or Pandas queries on the given csv file using LLMs.
- **Data Processing**: Returns downloadable results in `.csv` format.

---

## Technologies Used
- **Frontend**: `Angular` for an interactive user interface.  
- **Backend**: `Flask` for handling the backend, and `LangChain` for interfacing with the LLM.  
- **Database**: `AWS DynamoDB` for scalable cloud data storage.  
<!-- - **Deployment**: Docker for containerization and AWS/GCP for cloud deployment.   -->

---

## Installation  

### Frontend Setup  
1. Install Node.js: [Download here](https://nodejs.org/).  
2. Run the following commands:  
```bash  
   npm install -g @angular/cli  
   cd csv-query-app  
   npm install crypto-js  
   npm install prismjs
   npm install --save-dev @types/prismjs
```

### Backend Setup  
Install dependencies. Run from inside `520_Project/`:
```bash
    conda create -n querygenai python==3.10
    conda activate querygenai
    pip install -r requirements.txt
```

### Environment Variables
Since we are using LLMs via the OpenAI API, the key needs to be set in the environment variables. For this, create a `.env` file inside of `backend/app/Api` with the following configuration:
```bash
    OPENAI_API_KEY="YOUR_KEY_HERE"
```

## Running

### Frontend
Open a terminal and run the following:
```bash
    cd csv-query-app  
    ng serve
```

### Backend
Open another terminal and run the following:
```bash
    cd backend
    python run.py
```

Now the website can be visited at `http://localhost:4200/`.

## Unit Testing
For unit testing, run the following:
```bash
    cd backend/tests/
    pytest api_models.py        # tests the User and UserFile models used in the backend
    pytest sql_agent.py         # tests API for the SQL agent
    pytest pandas_agent.py      # tests API for the Pandas agent
    pytest validation.py        # tests query validation         
```
Alternatively, one can run all tests at once using `pytest *.py`

## AI Models

We use the following LLM models for processing results for various agents
```
Model for Pandas Agent = "gpt-3.5-turbo-instruct"
Model for SQL Agent = "gpt-4o-mini"
```