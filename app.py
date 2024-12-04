from flask import Flask, render_template, request, redirect, url_for, session, flash
import MySQLdb
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'secret'

db_config = {
    "host": "localhost",
    "user": "root",
    "passwd": "sql123",
    "db": "users_db"
}

def get_db_connection():
    return MySQLdb.connect(**db_config)

def create_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(200) NOT NULL
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tweets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        conn.commit()
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        cursor.close()
        conn.close()

create_table()

def time_ago(timestamp):
    now = datetime.now()
    diff = now - timestamp

    seconds = diff.total_seconds()
    if seconds < 60:
        return f"{int(seconds)} detik yang lalu"
    elif seconds < 3600:
        return f"{int(seconds // 60)} menit yang lalu"
    elif seconds < 86400:
        return f"{int(seconds // 3600)} jam yang lalu"
    elif seconds < 2592000:
        return f"{int(seconds // 86400)} hari yang lalu"
    elif seconds < 31536000:
        return f"{int(seconds // 2592000)} bulan yang lalu"
    else:
        return f"{int(seconds // 31536000)} tahun yang lalu"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    if not name or not email or not password:
        flash('Semua kolom harus diisi!', 'error')
        return redirect(url_for('home'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            flash('Email sudah terdaftar!', 'error')
            return redirect(url_for('home'))
        
        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
            (name, email, hashed_password)
        )
        conn.commit()
        flash('Registrasi berhasil!', 'success')
    except Exception as e:
        flash(f'Error: {e}', 'error')
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('home'))

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, password FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if user and check_password_hash(user[3], password):
            session['user_id'] = user[0]
            print(f"User ID set in session: {session['user_id']}")
            return redirect(url_for('user_home'))
        else:
            flash('Email atau password salah!', 'error')
    except Exception as e:
        flash(f'Error: {e}')
    finally:
        cursor.close()
        conn.close()
    return redirect(url_for('home'))

@app.route('/home')
def user_home():
    user_id = session.get('user_id')
    print(f"Session User ID: {user_id}")

    tweets = []
    user_info = None
    if user_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            print(f"User fetched from database: {user}")

            if user:
                user_info = {
                    'name': user[0],
                    'username': user[1].split('@')[0]
                }
                print(f"User Info: {user_info}")

            cursor.execute("SELECT t.content, t.created_at, u.name FROM tweets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC")
            tweets = cursor.fetchall()

            tweets_with_time_ago = []
            for tweet in tweets:
                content, created_at, name = tweet
                time_ago_str = time_ago(created_at)
                tweets_with_time_ago.append((content, time_ago_str, name))

            return render_template('home.html', user_info=user_info, tweets=tweets_with_time_ago)
        except Exception as e:
            flash(f'Error: {e}')
        finally:
            cursor.close()
            conn.close()
    else:
        print("User ID not found in session.")
    return redirect(url_for('home'))

@app.route('/postingan', methods=['POST'])
def postingan():
    user_id = session.get('user_id')
    content = request.form.get('content')

    if not user_id or not content:
        flash('Anda harus login dan mengisi konten tweet!', 'error')
        return redirect(url_for('user_home'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tweets (user_id, content) VALUES (%s, %s)",
            (user_id, content)
        )
        conn.commit()
    except Exception as e:
        flash(f'Error: {e}', 'error')
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('user_home'))

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Berhasil logout!', 'success')
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
