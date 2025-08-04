-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table for storing e-learning content
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) DEFAULT 'html',
    content_data JSONB NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity templates for reusable content structures
CREATE TABLE IF NOT EXISTS activity_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default activity templates
INSERT INTO activity_templates (name, description, template_data, category) VALUES
('Simple Quiz', 'Basic multiple choice quiz template', 
 '{"type": "quiz", "questions": [{"question": "Sample question?", "options": ["Option A", "Option B", "Option C"], "correct": 0}]}', 
 'assessment'),
('Text Content', 'Simple text content with formatting', 
 '{"type": "text", "content": "<h2>Title</h2><p>Your content here...</p>"}', 
 'content'),
('Interactive Cards', 'Flip cards for learning content', 
 '{"type": "cards", "cards": [{"front": "Term", "back": "Definition"}]}', 
 'interactive')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);
CREATE INDEX IF NOT EXISTS idx_activities_public ON activities(is_public);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);