from flask import Flask, render_template, request, redirect, url_for, session, flash
import MySQLdb

app = Flask(__name__)
app.secret_key = 'secret'

db_config = {
    "host": "localhost",
    "user": "root",
    "passwd": "amay",
    "db": "users_db"
}

def get_db_connection():
    return MySQLdb.connect(**db_config)

# Membuat tabel
def create_tables():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Tabel users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(200) NOT NULL
            );
        """)
        
        # Tabel posts
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        """)
        
        # Tabel comments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        """)
        conn.commit()
    except Exception as e:
        print(f"Error creating tables: {e}")
    finally:
        cursor.close()
        conn.close()

create_tables()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')

    if not name or not email or not password:
        flash('Semua kolom harus diisi!')
        return redirect(url_for('home'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Periksa apakah email sudah terdaftar
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            flash('Email sudah terdaftar!')
            return redirect(url_for('home'))

        # Insert user baru
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
            (name, email, password)
        )
        conn.commit()
        flash('Registrasi berhasil!')
    except Exception as e:
        flash(f'Error: {e}')
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

        # Periksa apakah email dan password cocok
        cursor.execute("SELECT id, name FROM users WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()
        if user:
            session['user_id'] = user[0]
            session['user_name'] = user[1]
            flash(f'Selamat datang, {user[1]}!')
            return redirect(url_for('user_home'))
        else:
            flash('Email atau password salah!')
    except Exception as e:
        flash(f'Error: {e}')
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('home'))


@app.route('/home', methods=['GET', 'POST'])
def user_home():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('home'))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if request.method == 'POST':
            if 'content' in request.form:
                # Menambahkan posting baru
                content = request.form.get('content')
                if content:
                    cursor.execute("INSERT INTO posts (user_id, content) VALUES (%s, %s)", (user_id, content))
                    conn.commit()
                    flash('Posting berhasil ditambahkan!')
            elif 'comment' in request.form:
                # Menambahkan komentar baru
                comment = request.form.get('comment')
                post_id = request.form.get('post_id')
                if comment and post_id:
                    cursor.execute("INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s)", 
                                   (post_id, user_id, comment))
                    conn.commit()
                    flash('Komentar berhasil ditambahkan!')

        # Mengambil semua posting
        cursor.execute("""
            SELECT posts.id, posts.content, posts.created_at, users.name
            FROM posts
            JOIN users ON posts.user_id = users.id
            ORDER BY posts.created_at DESC
        """)
        posts = cursor.fetchall()

        # Mengambil komentar untuk setiap posting
        post_comments = {}
        for post in posts:
            cursor.execute("""
                SELECT comments.content, comments.created_at, users.name
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.post_id = %s
                ORDER BY comments.created_at ASC
            """, (post[0],))
            post_comments[post[0]] = cursor.fetchall()

        return render_template('home.html', user=session['user_name'], posts=posts, post_comments=post_comments)
    except Exception as e:
        flash(f'Error: {e}')
        return redirect(url_for('home'))  # Redirect jika terjadi error
    finally:
        cursor.close()
        conn.close()

@app.route('/post/<int:post_id>', methods=['GET', 'POST'])
def post_detail(post_id):
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('home'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Mengambil posting berdasarkan ID
        cursor.execute("""
            SELECT posts.id, posts.content, posts.created_at, users.name
            FROM posts
            JOIN users ON posts.user_id = users.id
            WHERE posts.id = %s
        """, (post_id,))
        post = cursor.fetchone()

        # Mengambil komentar untuk posting ini
        cursor.execute("""
            SELECT comments.content, comments.created_at, users.name
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.post_id = %s
            ORDER BY comments.created_at ASC
        """, (post_id,))
        comments = cursor.fetchall()

        if request.method == 'POST':
            # Menambahkan komentar baru
            comment = request.form.get('comment')
            if comment:
                cursor.execute("INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s)", 
                               (post_id, user_id, comment))
                conn.commit()
                flash('Komentar berhasil ditambahkan!')
                return redirect(url_for('post_detail', post_id=post_id))  # Redirect untuk menampilkan komentar yang baru ditambahkan

        return render_template('post_detail.html', post=post, comments=comments)

    except Exception as e:
        flash(f'Error: {e}')
        return redirect(url_for('home'))
    finally:
        cursor.close()
        conn.close()

@app.route('/logout')
def logout():
    session.clear()
    flash('Berhasil logout!')
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
