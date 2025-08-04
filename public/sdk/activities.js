/**
 * HTML Activities Designer SDK
 * Easy embedding of activities in external websites
 */

(function(window) {
  'use strict';

  // Configuration
  const DEFAULT_API_BASE = window.location.origin;
  
  // Main SDK object
  const HTMLActivities = {
    version: '1.0.0',
    apiBase: DEFAULT_API_BASE,
    
    /**
     * Configure the SDK
     */
    config: function(options) {
      if (options.apiBase) {
        this.apiBase = options.apiBase.replace(/\/$/, ''); // Remove trailing slash
      }
    },
    
    /**
     * Render an activity in a container
     */
    render: function(slug, containerId, options) {
      options = options || {};
      const container = typeof containerId === 'string' 
        ? document.getElementById(containerId)
        : containerId;
      
      if (!container) {
        console.error('HTMLActivities: Container not found:', containerId);
        return;
      }
      
      // Show loading state
      container.innerHTML = this.getLoadingHTML();
      container.className = 'html-activity-container loading';
      
      // Fetch activity data
      this.fetchActivity(slug)
        .then(activity => {
          this.renderActivity(activity, container, options);
        })
        .catch(error => {
          console.error('HTMLActivities: Failed to load activity:', error);
          container.innerHTML = this.getErrorHTML(error.message);
          container.className = 'html-activity-container error';
        });
    },
    
    /**
     * Render activity using iframe (safer for external sites)
     */
    renderIframe: function(slug, containerId, options) {
      options = options || {};
      const container = typeof containerId === 'string' 
        ? document.getElementById(containerId)
        : containerId;
      
      if (!container) {
        console.error('HTMLActivities: Container not found:', containerId);
        return;
      }
      
      const iframe = document.createElement('iframe');
      iframe.src = `${this.apiBase}/api/embed/${slug}/render`;
      iframe.style.width = options.width || '100%';
      iframe.style.height = options.height || '600px';
      iframe.style.border = options.border || 'none';
      iframe.style.borderRadius = '8px';
      iframe.frameBorder = '0';
      iframe.setAttribute('allowfullscreen', '');
      
      container.innerHTML = '';
      container.appendChild(iframe);
      container.className = 'html-activity-container iframe';
    },
    
    /**
     * Fetch activity data from API
     */
    fetchActivity: function(slug) {
      return fetch(`${this.apiBase}/api/embed/${slug}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Activity "${slug}" not found or not public`);
          }
          return response.json();
        });
    },
    
    /**
     * Render activity content directly
     */
    renderActivity: function(activity, container, options) {
      container.className = 'html-activity-container loaded';
      
      if (activity.contentType === 'quiz') {
        this.renderQuiz(activity, container, options);
      } else if (activity.contentType === 'text') {
        this.renderText(activity, container, options);
      } else {
        this.renderGeneric(activity, container, options);
      }
    },
    
    /**
     * Render quiz activity
     */
    renderQuiz: function(activity, container, options) {
      const questions = activity.contentData.questions || [];
      const settings = activity.contentData.settings || {};
      
      const html = `
        <div class="activity-header">
          <h2 class="activity-title">${this.escapeHtml(activity.title)}</h2>
          ${activity.description ? `<p class="activity-description">${this.escapeHtml(activity.description)}</p>` : ''}
        </div>
        <div class="quiz-content">
          ${questions.map((question, qIndex) => `
            <div class="question" data-question="${qIndex}">
              <h3 class="question-text">${this.escapeHtml(question.question)}</h3>
              <div class="options">
                ${question.options.map((option, oIndex) => `
                  <label class="option">
                    <input type="radio" name="question-${qIndex}" value="${oIndex}">
                    <span class="option-text">${this.escapeHtml(option)}</span>
                  </label>
                `).join('')}
              </div>
              ${question.explanation ? `
                <div class="explanation" style="display: none;">
                  <p><strong>Explanation:</strong> ${this.escapeHtml(question.explanation)}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div class="controls">
          <button class="btn btn-primary" onclick="HTMLActivities.submitQuiz('${container.id}')">Submit Quiz</button>
          ${settings.allowRetry ? `<button class="btn btn-secondary" onclick="HTMLActivities.resetQuiz('${container.id}')" style="display: none;" id="retryBtn-${container.id}">Try Again</button>` : ''}
        </div>
        <div id="results-${container.id}" class="results" style="display: none;"></div>
      `;
      
      container.innerHTML = html;
      
      // Store activity data for quiz functions
      container._activityData = activity;
      
      // Apply styles
      this.applyStyles(container);
    },
    
    /**
     * Render text activity
     */
    renderText: function(activity, container, options) {
      const html = `
        <div class="activity-header">
          <h2 class="activity-title">${this.escapeHtml(activity.title)}</h2>
          ${activity.description ? `<p class="activity-description">${this.escapeHtml(activity.description)}</p>` : ''}
        </div>
        <div class="text-content">
          ${activity.contentData.content || ''}
        </div>
      `;
      
      container.innerHTML = html;
      this.applyStyles(container);
    },
    
    /**
     * Render generic activity
     */
    renderGeneric: function(activity, container, options) {
      const html = `
        <div class="activity-header">
          <h2 class="activity-title">${this.escapeHtml(activity.title)}</h2>
          ${activity.description ? `<p class="activity-description">${this.escapeHtml(activity.description)}</p>` : ''}
        </div>
        <div class="generic-content">
          <pre>${JSON.stringify(activity.contentData, null, 2)}</pre>
        </div>
      `;
      
      container.innerHTML = html;
      this.applyStyles(container);
    },
    
    /**
     * Submit quiz
     */
    submitQuiz: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container || !container._activityData) return;
      
      const activity = container._activityData;
      const questions = activity.contentData.questions || [];
      const settings = activity.contentData.settings || {};
      
      if (container._submitted) return;
      
      let score = 0;
      let total = questions.length;
      
      questions.forEach((question, qIndex) => {
        const selectedOption = container.querySelector(`input[name="question-${qIndex}"]:checked`);
        const questionElement = container.querySelector(`[data-question="${qIndex}"]`);
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
      const resultsDiv = container.querySelector(`#results-${containerId}`);
      
      let resultClass = 'poor';
      let resultText = 'Keep practicing!';
      
      if (percentage >= 80) {
        resultClass = 'good';
        resultText = 'Excellent work!';
      } else if (percentage >= 60) {
        resultClass = 'average';
        resultText = 'Good job!';
      }
      
      resultsDiv.innerHTML = `
        <h3>Quiz Results</h3>
        <p>You scored <strong>${score}/${total}</strong> (${percentage}%)</p>
        <p>${resultText}</p>
      `;
      resultsDiv.className = `results ${resultClass}`;
      resultsDiv.style.display = 'block';
      
      // Disable all inputs
      container.querySelectorAll('input[type="radio"]').forEach(input => input.disabled = true);
      container.querySelector('.btn-primary').style.display = 'none';
      
      if (settings.allowRetry) {
        const retryBtn = container.querySelector(`#retryBtn-${containerId}`);
        if (retryBtn) retryBtn.style.display = 'inline-block';
      }
      
      container._submitted = true;
    },
    
    /**
     * Reset quiz
     */
    resetQuiz: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container._submitted = false;
      container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = false;
        input.checked = false;
      });
      container.querySelectorAll('.option').forEach(option => {
        option.classList.remove('correct', 'incorrect');
      });
      container.querySelectorAll('.explanation').forEach(exp => exp.style.display = 'none');
      container.querySelector(`#results-${containerId}`).style.display = 'none';
      container.querySelector('.btn-primary').style.display = 'inline-block';
      const retryBtn = container.querySelector(`#retryBtn-${containerId}`);
      if (retryBtn) retryBtn.style.display = 'none';
    },
    
    /**
     * Apply default styles
     */
    applyStyles: function(container) {
      if (document.getElementById('html-activities-styles')) return;
      
      const styles = document.createElement('style');
      styles.id = 'html-activities-styles';
      styles.textContent = this.getDefaultCSS();
      document.head.appendChild(styles);
    },
    
    /**
     * Get loading HTML
     */
    getLoadingHTML: function() {
      return `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading activity...</p>
        </div>
      `;
    },
    
    /**
     * Get error HTML
     */
    getErrorHTML: function(message) {
      return `
        <div class="error-state">
          <h3>Error Loading Activity</h3>
          <p>${this.escapeHtml(message)}</p>
        </div>
      `;
    },
    
    /**
     * Escape HTML
     */
    escapeHtml: function(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    },
    
    /**
     * Get default CSS
     */
    getDefaultCSS: function() {
      return `
        .html-activity-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          background: #f8f9fa;
          border-radius: 10px;
        }
        .html-activity-container .activity-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .html-activity-container .activity-title {
          color: #333;
          margin-bottom: 10px;
          font-size: 2rem;
        }
        .html-activity-container .activity-description {
          color: #666;
          font-size: 1.1rem;
        }
        .html-activity-container .question {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: white;
        }
        .html-activity-container .question-text {
          color: #495057;
          margin-bottom: 15px;
          font-size: 1.2rem;
        }
        .html-activity-container .options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .html-activity-container .option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #dee2e6;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fafafa;
        }
        .html-activity-container .option:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }
        .html-activity-container .option input[type="radio"] {
          margin-right: 10px;
        }
        .html-activity-container .option-text {
          flex: 1;
        }
        .html-activity-container .explanation {
          margin-top: 15px;
          padding: 15px;
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 5px;
        }
        .html-activity-container .controls {
          text-align: center;
          margin-top: 30px;
        }
        .html-activity-container .btn {
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
        .html-activity-container .btn:hover {
          background: #0056b3;
        }
        .html-activity-container .btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        .html-activity-container .btn-secondary {
          background: #6c757d;
        }
        .html-activity-container .btn-secondary:hover {
          background: #545b62;
        }
        .html-activity-container .results {
          margin-top: 20px;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          font-size: 1.1rem;
        }
        .html-activity-container .results.good { 
          background: #d4edda; 
          border: 1px solid #c3e6cb; 
          color: #155724; 
        }
        .html-activity-container .results.average { 
          background: #fff3cd; 
          border: 1px solid #ffeaa7; 
          color: #856404; 
        }
        .html-activity-container .results.poor { 
          background: #f8d7da; 
          border: 1px solid #f5c6cb; 
          color: #721c24; 
        }
        .html-activity-container .correct { 
          background: #d4edda !important; 
          border-color: #c3e6cb !important; 
        }
        .html-activity-container .incorrect { 
          background: #f8d7da !important; 
          border-color: #f5c6cb !important; 
        }
        .html-activity-container .loading-state,
        .html-activity-container .error-state {
          text-align: center;
          padding: 40px 20px;
        }
        .html-activity-container .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-left: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .html-activity-container .text-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .html-activity-container .generic-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .html-activity-container .generic-content pre {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
        }
      `;
    }
  };
  
  // Auto-initialize if data attributes are found
  document.addEventListener('DOMContentLoaded', function() {
    const autoElements = document.querySelectorAll('[data-html-activity]');
    autoElements.forEach(element => {
      const slug = element.getAttribute('data-html-activity');
      const mode = element.getAttribute('data-mode') || 'embed';
      const options = {};
      
      // Parse options from data attributes
      if (element.getAttribute('data-width')) {
        options.width = element.getAttribute('data-width');
      }
      if (element.getAttribute('data-height')) {
        options.height = element.getAttribute('data-height');
      }
      
      if (mode === 'iframe') {
        HTMLActivities.renderIframe(slug, element, options);
      } else {
        HTMLActivities.render(slug, element, options);
      }
    });
  });
  
  // Export to global scope
  window.HTMLActivities = HTMLActivities;
  
})(window);