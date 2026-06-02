# QueryMind

# Natural Language SQL Query Generator

Convert natural language questions into SQL queries using Groq LLMs and execute them directly on a MySQL database through an interactive Streamlit interface.

## Features

* Natural Language → SQL conversion
* Groq LLM integration
* MySQL database support
* Dynamic database connection from the UI
* Dynamic Groq API key input from the UI
* Automatic database schema extraction
* Schema-aware query generation
* Query validation against database schema
* SQL query execution
* Query history tracking
* Export query results to CSV
* Modular architecture with shared backend logic
* No hardcoded database credentials
* No hardcoded API keys

---

## Project Structure

```text
project/
│
├── app.py              # Core application logic
├── db.py               # Database utilities and schema generation
├── ui.py               # Streamlit frontend
├── requirements.txt
├── README.md
└── .gitignore
```

---

## How It Works

1. Enter database credentials in the UI.
2. Enter your Groq API key.
3. Connect to the MySQL database.
4. The application automatically extracts the database schema.
5. Ask questions in plain English.
6. Groq generates a SQL query based on the schema.
7. The generated query is validated against the database structure.
8. The query is executed.
9. Results are displayed in the UI.
10. Query history is stored and results can be exported to CSV.

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/<username>/<repository>.git
cd <repository>
```

### Create a Virtual Environment

```bash
python -m venv venv
```

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Running the Application

```bash
streamlit run ui.py
```

---

## Example Queries

```text
Show all customers.

List the top 10 highest priced products.

How many orders were placed this month?

Show total sales by category.

Find customers who have not placed any orders.
```

---

## Refactoring Improvements

The project was refactored to improve maintainability while preserving existing functionality.

### Changes Made

* Centralized database functionality in `db.py`
* Shared schema generation logic across modules
* Shared query execution logic across modules
* Removed hardcoded credentials
* Removed hardcoded API keys
* Simplified project structure
* Improved code reusability

---

## Technologies Used

* Python
* Streamlit
* MySQL
* Groq API

---

## Security

* Database credentials are entered at runtime.
* Groq API keys are entered at runtime.
* Sensitive information is not stored in the codebase.

---

## .gitignore

```gitignore
__pycache__/
*.pyc

schema.txt

venv/
.env
```

---

## Future Enhancements

* PostgreSQL support
* SQL Server support
* SQLite support
* Docker deployment
* User authentication
* SQL explanation mode
* Multi-database management

---

## License

This project is open-source and available for educational and development purposes.
