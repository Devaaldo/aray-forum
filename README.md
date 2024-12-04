# Website Forum - Aray

This project is a simple web application built using Flask and SQLAlchemy. The application allows users to register, log in, and manage their sessions. User data is stored in an SQLite database.

## Features

- User registration with input validation
- User login with email and password verification
- User session management
- Informative error messages
- Users can post tweets and view a tweet feed

## Prerequisites

Before running this application, ensure you have Python and pip installed on your system. You will also need to install some required packages.

## Installation

1. **Clone this repository:**
 ```bash
 git clone https://github.com/Devaaldo/aray-forum.git
 cd repo-name
 ```

2. **Create and activate a virtual environment (optional but recommended):**
```bash
python -m venv venv source venv/bin/activate # For Linux/Mac
```
```bash
venv\Scripts\activate # Untuk Windows
```

3. **Install the required dependencies:**
```bash
pip install Flask Flask-SQLAlchemy
```

4. **Run the application:**
```bash
python app.py
```



5. **Access the application in your browser:**
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

## How to Use

1. **Registration:**
   - Enter your name, email, and password on the homepage and click "Register".
   - If the email is already registered, you will receive an error message.

2. **Login:**
   - Enter the email and password you registered with.
   - If successful, you will be redirected to the user homepage.

3. **Logout:**
   - Click the logout button to exit the session.

4. **Post a Tweet:**
   - After logging in, you can post tweets through the form provided on the user homepage.

5. **View Tweet Feed:**
   - On the user homepage, you can see all tweets posted by other users.

## Contribution

- [Muhammad Akbar Pradana / Devaaldo](https://github.com/devaaldo)
- [Amar Ma'ruf Ainul Yaqin / Amay](https://github.com/amarmarufainulyaqin)

## License

This project is licensed under the [MIT License](LICENSE).
