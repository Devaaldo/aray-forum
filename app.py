from flask import Flask, render_template, request, redirect, url_for, session, flash
import MySQLdb
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'static/uploads'  
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = 'secret'

db_config = {
    "host": "localhost",
    "user": "root",
    "passwd": "kalitengah",
    "db": "users_db"
}

def get_db_connection():
    return MySQLdb.connect(**db_config)

def create_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Membuat tabel users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(200) NOT NULL
            );
        """)
        
        # Membuat tabel tweets
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tweets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)

        # Memeriksa apakah kolom image_path ada, jika tidak, tambahkan
        cursor.execute("SHOW COLUMNS FROM tweets LIKE 'image_path';")
        result = cursor.fetchone()
        if not result:
            cursor.execute("ALTER TABLE tweets ADD COLUMN image_path VARCHAR(255);")

        # Membuat tabel followers
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS followers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                follower_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (follower_id) REFERENCES users(id)
            );
        """)
        
        conn.commit()
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        cursor.close()
        conn.close()




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
    user_id = session.get('user_id')  # Ambil user_id dari session

    # Jika pengguna belum login, arahkan ke halaman login
    if not user_id:
        return redirect(url_for('login_page'))  # Ganti 'login_page' dengan nama route untuk halaman login

    user_info = None
    tweets = [] 

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if user:
            user_info = {
                'name': user[0],
                'username': user[1].split('@')[0],
                'id': user_id  # Pastikan id ditambahkan di sini
            }

        cursor.execute("""
            SELECT t.content, t.created_at, t.image_path, u.id, u.name 
            FROM tweets t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
        """)
        tweets = cursor.fetchall()

    except Exception as e:
        print(f"Error fetching data: {e}")
    finally:
        cursor.close()
        conn.close()

    return render_template('home.html', user_info=user_info, tweets=tweets)



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
        flash('error')
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('home'))

@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'POST':
        # Logika untuk menangani login
        email = request.form.get('email')
        password = request.form.get('password')

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, password FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if user and check_password_hash(user[3], password):
                session['user_id'] = user[0]
                return redirect(url_for('home'))  # Arahkan ke halaman home setelah login
            else:
                flash('Email atau password salah!', 'error')
        except Exception as e:
            flash(f'Error: {e}')
        finally:
            cursor.close()
            conn.close()

    return render_template('index.html')  # Tampilkan halaman login


@app.route('/home', methods=['GET', 'POST'])
def user_home():
    user_id = session.get('user_id')

    if request.method == 'POST':
        # Menangani pengunggahan postingan
        content = request.form.get('content')  # Ambil konten dari form
        if content:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("INSERT INTO tweets (user_id, content) VALUES (%s, %s)", (user_id, content))
                conn.commit()
                flash('Postingan berhasil ditambahkan!', 'success')
            except Exception as e:
                flash(f'Error: {e}', 'error')
            finally:
                cursor.close()
                conn.close()

    # Ambil data pengguna dan postingan
    tweets = []
    user_info = None
    if user_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()

            if user:
                user_info = {
                    'name': user[0],
                    'username': user[1].split('@')[0],
                    'id': user_id
                }

            cursor.execute("SELECT t.content, t.created_at, t.image_path, u.id, u.name FROM tweets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC")
            tweets = cursor.fetchall()

        except Exception as e:
            flash(f'Error fetching data: {e}')
        finally:
            cursor.close()
            conn.close()
    else:
        flash('Anda harus login untuk mengakses halaman ini!', 'error')
        return redirect(url_for('login_page'))

    return render_template('home.html', user_info=user_info, tweets=tweets)




@app.route('/postingan', methods=['POST'])
def postingan():
    user_id = session.get('user_id')
    content = request.form.get('content')
    image = request.files.get('image')  # **Get uploaded image**

    if not user_id or not content:
        flash('Anda harus login dan mengisi konten tweet!', 'error')
        return redirect(url_for('user_home'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Save image if it exists
        image_path = None
        if image:
            image_filename = secure_filename(image.filename)  # **Secure the filename**
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))
            image_path = f'uploads/{image_filename}'  # **Save relative path**

        # Insert tweet into database including image_path
        cursor.execute(
            "INSERT INTO tweets (user_id, content, image_path) VALUES (%s, %s, %s)",
            (user_id, content, image_path)  # **Include image_path here**
        )
        conn.commit()
        flash('Postingan berhasil ditambahkan!', 'success')
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
    return redirect(url_for('login_page'))

@app.route('/profile/<int:user_id>', endpoint='user_profile_view')
def user_profile(user_id):
    user_info = None
    tweets = []  # Untuk menyimpan postingan pengguna
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if user:
            user_info = {
                'name': user[0],
                'email': user[1],
                'id': user_id
            }

            # Ambil postingan pengguna
            cursor.execute("SELECT content, created_at FROM tweets WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
            tweets = cursor.fetchall()
        else:
            flash('Pengguna tidak ditemukan!', 'error')
            return redirect(url_for('home'))
    except Exception as e:
        print(f'Error fetching user profile: {e}')
        flash('Terjadi kesalahan saat mengambil profil pengguna.', 'error')
        return redirect(url_for('home'))
    finally:
        cursor.close()
        conn.close()

    return render_template('profile.html', user_info=user_info, tweets=tweets)




@app.route('/profile', endpoint='current_user_profile')  # Ubah nama endpoint
def current_profile():
    user_id = session.get('user_id')
    user_info = None

    if user_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, email, 
                    (SELECT COUNT(*) FROM tweets WHERE user_id = %s) AS tweet_count, 
                    (SELECT COUNT(*) FROM followers WHERE user_id = %s) AS follower_count, 
                    (SELECT COUNT(*) FROM followers WHERE follower_id = %s) AS following_count 
                FROM users 
                WHERE id = %s
            """, (user_id, user_id, user_id, user_id))
            user = cursor.fetchone()

            if user:
                user_info = {
                    'id': user[0],  # Menyimpan user_id
                    'name': user[1],
                    'email': user[2],
                    'tweet_count': user[3],
                    'follower_count': user[4],
                    'following_count': user[5],
                    'username': user[2].split('@')[0]  # Mengambil username dari email
                }
        except Exception as e:
            flash(f'Error: {e}')
        finally:
            cursor.close()
            conn.close()
    else:
        flash('Anda harus login untuk mengakses profil!', 'error')
        return redirect(url_for('home'))

    return render_template('profile.html', user_info=user_info)


if __name__ == '__main__':
    create_table()
    app.run(debug=True)

# test