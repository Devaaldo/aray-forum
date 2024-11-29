from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = 'secret'

# Mengkonfigurasi DB SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Menginisialisasi DB
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<User {self.name}>'

# Membuat DB
with app.app_context():
    db.create_all()

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
    
    # Periksa apakah email sudah terdaftar
    if User.query.filter_by(email=email).first():
        flash('Email sudah terdaftar!')  # Menyimpan pesan kesalahan
        return redirect(url_for('home'))

    # Membuat user baru
    new_user = User(name=name, email=email, password=password)

    # Menambahkan user ke database
    db.session.add(new_user)
    db.session.commit()

    return redirect(url_for('home'))

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    # Check jika sudah terdaftar
    user = User.query.filter_by(email=email, password=password).first()
    if user:
        session['user_id'] = user.id  
        return redirect(url_for('user_home')) 
    else:
        flash('Email & Password salah!')
        return redirect(url_for('home'))

@app.route('/home')
def user_home():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        return render_template('home.html', user=user)
    else:
        return redirect(url_for('home')) 

@app.route('/logout')
def logout():
    session.pop('user_id', None) 
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
