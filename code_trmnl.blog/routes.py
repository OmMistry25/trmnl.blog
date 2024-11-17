from datetime import datetime
from flask import render_template, jsonify, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User, Post, Profile

@app.route('/')
def terminal():
    return render_template('terminal.html')

@app.route('/api/posts')
def get_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([{
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'category': post.category,
        'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S') if post.created_at else 'N/A'
    } for post in posts])

@app.route('/api/posts/<int:post_id>')
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify({
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'category': post.category,
        'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S') if post.created_at else 'N/A'
    })

@app.route('/api/profile')
def get_profile():
    # Get the first user's profile (admin)
    profile = Profile.query.first()
    if profile:
        return jsonify({
            'bio': profile.bio,
            'philosophy': profile.philosophy
        })
    return jsonify({
        'bio': 'Profile not found',
        'philosophy': 'Profile not found'
    })

@app.route('/admin/profile', methods=['GET', 'POST'])
@login_required
def admin_profile():
    profile = current_user.profile
    if profile is None:
        # Create profile if it doesn't exist
        profile = Profile(
            user_id=current_user.id,
            bio='A passionate developer...',
            philosophy='Writing about technology...'
        )
        db.session.add(profile)
        db.session.commit()
    
    if request.method == 'POST':
        profile.bio = request.form['bio']
        profile.philosophy = request.form['philosophy']
        db.session.commit()
        flash('Profile updated successfully')
        return redirect(url_for('admin_dashboard'))
    return render_template('admin/profile.html', profile=profile)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        app.logger.debug(f"Login attempt for username: {username}")
        
        user = User.query.filter_by(username=username).first()
        app.logger.debug(f"User found: {user is not None}")
        
        if user:
            password_check = user.check_password(password)
            app.logger.debug(f"Password check result: {password_check}")
            if password_check:
                app.logger.info(f"Successful login for user: {user.username}")
                login_user(user)
                return redirect(url_for('admin_dashboard'))
        
        app.logger.warning(f"Failed login attempt for username: {username}")
        flash('Invalid username or password')
    return render_template('admin/login.html')

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return render_template('admin/dashboard.html', posts=posts)

@app.route('/admin/posts/new', methods=['POST'])
@login_required
def new_post():
    post = Post(
        title=request.form['title'],
        content=request.form['content'],
        category=request.form['category'],
        user_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.session.add(post)
    db.session.commit()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/posts/<int:post_id>/edit', methods=['POST'])
@login_required
def edit_post(post_id):
    post = Post.query.get_or_404(post_id)
    post.title = request.form['title']
    post.content = request.form['content']
    post.category = request.form['category']
    post.updated_at = datetime.utcnow()
    db.session.commit()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/posts/<int:post_id>/delete', methods=['POST'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('terminal'))
