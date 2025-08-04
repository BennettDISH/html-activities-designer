# Sample Activities

This folder contains ready-to-use sample activities for testing your HTML Activities Designer platform.

## 📁 Files

- **`sample-activities.json`** - JSON data for all sample activities
- **`index.html`** - Visual overview of all samples
- **`test-*.html`** - Individual test files for each activity

## 🚀 Quick Start

1. **View the samples**: Open `index.html` in your browser
2. **Copy activity data**: Use the JSON from `sample-activities.json`
3. **Create activities**: Paste data into your activity builder
4. **Test embedding**: Use the test HTML files

## 📚 Sample Activities Included

### Quiz Activities
- **JavaScript Basics Quiz** (`javascript-basics-quiz`)
  - 4 questions about JS fundamentals
  - Variables, functions, operators, arrays
  
- **HTML Fundamentals Quiz** (`html-fundamentals-quiz`)
  - 4 questions about HTML basics
  - Elements, attributes, structure
  
- **CSS Styling Essentials** (`css-styling-essentials`)
  - 4 questions about CSS
  - Selectors, properties, styling
  
- **React Development Quiz** (`react-development-quiz`)
  - 4 questions about React
  - Components, hooks, JSX

### Text Content Activities
- **Web Development Introduction** (`web-development-intro`)
  - Comprehensive overview of web development
  - Front-end, back-end, tools, best practices
  
- **Database Fundamentals** (`database-fundamentals`)
  - Database concepts and design
  - SQL, NoSQL, relationships, optimization

## 🔧 How to Create Activities

1. **Login to your dashboard**
2. **Click "Create New Activity"**
3. **Copy JSON data** from `sample-activities.json`
4. **Fill in the form** with the data:
   - Title
   - Description  
   - Slug (must match exactly)
   - Content type (quiz or text)
   - Content data (questions or HTML)
5. **Make it public**
6. **Save**

## 🧪 Testing Activities

Each `test-*.html` file shows:
- Activity details and requirements
- Multiple embedding methods
- Live preview (once activity is created)
- Copy-paste embed codes

### Test Files:
- `test-javascript-quiz.html`
- `test-html-quiz.html`
- `test-css-quiz.html` 
- `test-react-quiz.html`
- `test-web-dev-intro.html`
- `test-database-content.html`

## 🌐 Embedding Methods Demonstrated

### 1. Auto-initialization (Easiest)
```html
<script src="https://your-domain.railway.app/sdk/activities.js"></script>
<div data-html-activity="your-activity-slug"></div>
```

### 2. JavaScript Control
```html
<script src="https://your-domain.railway.app/sdk/activities.js"></script>
<div id="my-activity"></div>
<script>
  HTMLActivities.render('your-activity-slug', 'my-activity');
</script>
```

### 3. iframe Embedding
```html
<iframe src="https://your-domain.railway.app/api/embed/your-activity-slug/render" 
        width="100%" height="600px" frameborder="0"></iframe>
```

## ✅ Requirements

- Activities must be **public** to be embedded
- **Slugs must match exactly** (case-sensitive)
- Activities must be **saved** in your dashboard first

## 🎯 Perfect for Testing

These samples are perfect for:
- Testing your platform setup
- Demonstrating to clients
- Learning the embedding system
- Creating your own activities

## 🔗 URLs

Once created, activities will be available at:
- **JSON API**: `/api/embed/{slug}`
- **Rendered HTML**: `/api/embed/{slug}/render`
- **Test files**: `/samples/test-{name}.html`

Start with `index.html` for a visual overview of all available samples!