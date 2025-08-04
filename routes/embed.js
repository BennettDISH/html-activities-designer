import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get activity for embedding (public endpoint)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    console.log('Embed request for slug:', slug);

    // Get activity by slug (only public activities or if user owns it)
    const result = await pool.query(
      `SELECT a.*, u.username as author 
       FROM activities a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.slug = $1 AND a.is_public = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Activity not found or not public',
        slug: slug 
      });
    }

    const activity = result.rows[0];
    
    // Track view (optional - you can add a views table later)
    // await pool.query('UPDATE activities SET views = views + 1 WHERE id = $1', [activity.id]);

    console.log('Serving activity:', activity.title);

    res.json({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      slug: activity.slug,
      contentType: activity.content_type,
      contentData: activity.content_data,
      author: activity.author,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at
    });
  } catch (error) {
    console.error('Embed endpoint error:', error);
    res.status(500).json({ error: 'Failed to load activity' });
  }
});

// Render activity as HTML (for iframe embedding)
router.get('/:slug/render', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get activity data
    const result = await pool.query(
      `SELECT a.*, u.username as author 
       FROM activities a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.slug = $1 AND a.is_public = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>Activity Not Found</h2>
            <p>The activity "${slug}" could not be found or is not public.</p>
          </body>
        </html>
      `);
    }

    const activity = result.rows[0];
    
    // Generate HTML based on activity type
    let activityHTML = '';
    
    if (activity.content_type === 'quiz') {
      activityHTML = generateQuizHTML(activity.content_data, activity.title);
    } else if (activity.content_type === 'text') {
      activityHTML = generateTextHTML(activity.content_data, activity.title);
    } else {
      activityHTML = generateGenericHTML(activity.content_data, activity.title);
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(activityHTML);
  } catch (error) {
    console.error('Render endpoint error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>Error Loading Activity</h2>
          <p>There was an error loading this activity. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

// Generate HTML for quiz activities
function generateQuizHTML(contentData, title) {
  const questions = contentData.questions || [];
  const settings = contentData.settings || {};
  
  const questionsHTML = questions.map((question, qIndex) => `
    <div class="question" data-question="${qIndex}">
      <h3 class="question-text">${escapeHtml(question.question)}</h3>
      <div class="options">
        ${question.options.map((option, oIndex) => `
          <label class="option">
            <input type="radio" name="question-${qIndex}" value="${oIndex}">
            <span class="option-text">${escapeHtml(option)}</span>
          </label>
        `).join('')}
      </div>
      ${question.explanation ? `
        <div class="explanation" style="display: none;">
          <p><strong>Explanation:</strong> ${escapeHtml(question.explanation)}</p>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          background: #f8f9fa;
        }
        .activity-container {
          background: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .activity-title {
          color: #333;
          margin-bottom: 30px;
          text-align: center;
          font-size: 2rem;
        }
        .question {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #fafafa;
        }
        .question-text {
          color: #495057;
          margin-bottom: 15px;
          font-size: 1.2rem;
        }
        .options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #dee2e6;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }
        .option:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }
        .option input[type="radio"] {
          margin-right: 10px;
        }
        .option-text {
          flex: 1;
        }
        .explanation {
          margin-top: 15px;
          padding: 15px;
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 5px;
        }
        .controls {
          text-align: center;
          margin-top: 30px;
        }
        .btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
          margin: 0 10px;
          transition: background 0.3s ease;
        }
        .btn:hover {
          background: #0056b3;
        }
        .btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        .results {
          margin-top: 20px;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          font-size: 1.1rem;
        }
        .results.good { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .results.average { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .results.poor { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .correct { background: #d4edda !important; border-color: #c3e6cb !important; }
        .incorrect { background: #f8d7da !important; border-color: #f5c6cb !important; }
      </style>
    </head>
    <body>
      <div class="activity-container">
        <h1 class="activity-title">${escapeHtml(title)}</h1>
        <div class="quiz-content">
          ${questionsHTML}
        </div>
        <div class="controls">
          <button class="btn" onclick="submitQuiz()">Submit Quiz</button>
          ${settings.allowRetry ? '<button class="btn" onclick="resetQuiz()" style="display: none;" id="retryBtn">Try Again</button>' : ''}
        </div>
        <div id="results" class="results" style="display: none;"></div>
      </div>

      <script>
        const questions = ${JSON.stringify(questions)};
        const settings = ${JSON.stringify(settings)};
        let submitted = false;

        function submitQuiz() {
          if (submitted) return;
          
          let score = 0;
          let total = questions.length;
          
          questions.forEach((question, qIndex) => {
            const selectedOption = document.querySelector('input[name="question-' + qIndex + '"]:checked');
            const questionElement = document.querySelector('[data-question="' + qIndex + '"]');
            const options = questionElement.querySelectorAll('.option');
            
            if (selectedOption) {
              const selectedValue = parseInt(selectedOption.value);
              const correctValue = question.correct;
              
              if (selectedValue === correctValue) {
                score++;
                options[selectedValue].classList.add('correct');
              } else {
                options[selectedValue].classList.add('incorrect');
                options[correctValue].classList.add('correct');
              }
            } else {
              options[question.correct].classList.add('correct');
            }
            
            if (settings.showExplanations && question.explanation) {
              const explanation = questionElement.querySelector('.explanation');
              if (explanation) explanation.style.display = 'block';
            }
          });
          
          const percentage = Math.round((score / total) * 100);
          const resultsDiv = document.getElementById('results');
          
          let resultClass = 'poor';
          let resultText = 'Keep practicing!';
          
          if (percentage >= 80) {
            resultClass = 'good';
            resultText = 'Excellent work!';
          } else if (percentage >= 60) {
            resultClass = 'average';
            resultText = 'Good job!';
          }
          
          resultsDiv.innerHTML = \`
            <h3>Quiz Results</h3>
            <p>You scored <strong>\${score}/\${total}</strong> (\${percentage}%)</p>
            <p>\${resultText}</p>
          \`;
          resultsDiv.className = 'results ' + resultClass;
          resultsDiv.style.display = 'block';
          
          // Disable all inputs
          document.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
          document.querySelector('.btn').style.display = 'none';
          
          if (settings.allowRetry) {
            document.getElementById('retryBtn').style.display = 'inline-block';
          }
          
          submitted = true;
        }
        
        function resetQuiz() {
          submitted = false;
          document.querySelectorAll('input[type="radio"]').forEach(input => {
            input.disabled = false;
            input.checked = false;
          });
          document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('correct', 'incorrect');
          });
          document.querySelectorAll('.explanation').forEach(exp => exp.style.display = 'none');
          document.getElementById('results').style.display = 'none';
          document.querySelector('.btn').style.display = 'inline-block';
          document.getElementById('retryBtn').style.display = 'none';
        }
      </script>
    </body>
    </html>
  `;
}

// Generate HTML for text activities
function generateTextHTML(contentData, title) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          background: #f8f9fa;
        }
        .activity-container {
          background: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .activity-title {
          color: #333;
          margin-bottom: 30px;
          text-align: center;
          font-size: 2rem;
        }
        .content {
          color: #495057;
        }
      </style>
    </head>
    <body>
      <div class="activity-container">
        <h1 class="activity-title">${escapeHtml(title)}</h1>
        <div class="content">
          ${contentData.content || ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate HTML for generic activities
function generateGenericHTML(contentData, title) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          background: #f8f9fa;
        }
        .activity-container {
          background: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <div class="activity-container">
        <h1>${escapeHtml(title)}</h1>
        <pre>${JSON.stringify(contentData, null, 2)}</pre>
      </div>
    </body>
    </html>
  `;
}

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export default router;