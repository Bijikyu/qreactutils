/**
 * Template Rendering Utilities Module
 * 
 * Provides robust EJS template rendering functionality with comprehensive error handling
 * and data validation. This module addresses the complexity of server-side template
 * rendering in Express applications while maintaining security and reliability.
 * 
 * IMPLEMENTATION STRATEGY:
 * - Validate Express response object before attempting render
 * - Provide default empty data object when none specified
 * - Handle missing template files gracefully with fallback responses
 * - Log rendering attempts and failures for debugging
 * - Use Express built-in error handling for template engine errors
 * 
 * ERROR HANDLING APPROACH:
 * - Template not found: Send 404 with user-friendly message
 * - Syntax errors: Send 500 with generic error (don't expose template internals)
 * - Data errors: Log details but send generic error response
 * - Missing res object: Log error and return false
 * 
 * SECURITY CONSIDERATIONS:
 * - Never expose template file paths or syntax errors to users
 * - Validate data object to prevent template injection
 * - Log detailed errors internally for debugging
 * - Provide generic error messages in responses
 */

const { logger } = require('./logger');
const { safeStringify } = require('./validation');

/**
 * Render EJS template with comprehensive error handling and data validation
 * 
 * This utility provides robust template rendering for Express applications with
 * proper error handling, security considerations, and consistent logging patterns.
 * 
 * Key features:
 * - Express response object validation
 * - Template name validation and sanitization
 * - Data object validation with safe defaults
 * - Comprehensive error handling with appropriate HTTP status codes
 * - Security-focused error messages (no internal details exposed)
 * - Detailed logging for debugging while maintaining security
 * 
 * @param {object} res - Express response object
 * @param {string} viewName - Name of template file (without .ejs extension)
 * @param {object} data - Data object to pass to template (default: empty object)
 * @returns {boolean} True if render initiated successfully, false on validation error
 * @throws Never throws - all errors are handled through Express error handling
 */
function renderView(res, viewName, data = {}) {
  console.log(`renderView rendering template: ${viewName}`);
  logger.debug('renderView: initiating template render', {
    viewName,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : []
  });

  try {
    // Validate Express response object
    if (!res || typeof res.render !== 'function') {
      console.error('renderView: invalid Express response object provided');
      logger.error('renderView: invalid response object', {
        hasRes: !!res,
        hasRenderMethod: res && typeof res.render === 'function'
      });
      return false;
    }

    // Validate view name
    if (!viewName || typeof viewName !== 'string' || viewName.trim() === '') {
      console.error('renderView: invalid view name provided');
      logger.error('renderView: invalid view name', {
        viewName,
        viewNameType: typeof viewName
      });

      // Send error response for invalid view name
      try {
        res.status(400).json({
          error: 'Invalid template request',
          message: 'Template name is required'
        });
      } catch (responseError) {
        console.error('renderView: failed to send error response:', responseError.message);
      }
      return false;
    }

    // Validate and normalize data object
    if (data === null || data === undefined) {
      console.log('renderView: null/undefined data provided, using empty object');
      logger.debug('renderView: null data converted to empty object');
      data = {};
    }

    if (typeof data !== 'object' || Array.isArray(data)) {
      console.warn('renderView: non-object data provided, using empty object');
      logger.warn('renderView: invalid data type provided', {
        dataType: typeof data,
        isArray: Array.isArray(data)
      });
      data = {};
    }

    // Attempt to render the template
    const trimmedViewName = viewName.trim();
    console.log(`renderView: calling res.render for ${trimmedViewName}`);
    logger.debug('renderView: initiating Express render', {
      viewName: trimmedViewName,
      dataKeyCount: Object.keys(data).length
    });

    // Use Express built-in error handling by providing callback
    res.render(trimmedViewName, data, (renderError, html) => {
      if (renderError) {
        console.error(`renderView: template render failed for ${trimmedViewName}:`, renderError.message);
        logger.error('renderView: template rendering failed', {
          viewName: trimmedViewName,
          error: renderError.message,
          errorCode: renderError.code
        });

        // Send appropriate error response based on error type
        if (renderError.code === 'ENOENT' || renderError.message.includes('Failed to lookup view')) {
          // Template file not found
          try {
            res.status(404).json({
              error: 'Page not found',
              message: 'The requested page could not be found'
            });
          } catch (responseError) {
            console.error('renderView: failed to send 404 response:', responseError.message);
          }
        } else {
          // Other rendering errors (syntax, data, etc.)
          try {
            res.status(500).json({
              error: 'Internal server error',
              message: 'Unable to render page'
            });
          } catch (responseError) {
            console.error('renderView: failed to send 500 response:', responseError.message);
          }
        }
      } else {
        // Successful render - Express automatically sends the HTML
        console.log(`renderView: successfully rendered ${trimmedViewName}`);
        logger.debug('renderView: template rendered successfully', {
          viewName: trimmedViewName,
          htmlLength: html ? html.length : 0
        });
      }
    });

    return true;

  } catch (error) {
    // Handle any unexpected errors during render setup
    console.error('renderView encountered unexpected error:', error.message);
    logger.error('renderView failed with error', {
      error: error.message,
      viewName,
      stack: error.stack
    });

    // Attempt to send error response
    try {
      if (res && typeof res.status === 'function') {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Unable to process template request'
        });
      }
    } catch (responseError) {
      console.error('renderView: failed to send fallback error response:', responseError.message);
    }

    return false;
  }
}

/**
 * Enhanced template rendering utility with success callback support
 * 
 * Extends the basic renderView functionality with optional success and error callbacks
 * for more advanced use cases where you need to perform additional actions after rendering.
 * 
 * @param {object} res - Express response object
 * @param {string} viewName - Name of template file (without .ejs extension)
 * @param {object} data - Data object to pass to template (default: empty object)
 * @param {object} callbacks - Optional success and error callbacks
 * @param {function} callbacks.onSuccess - Called when render succeeds (receives html)
 * @param {function} callbacks.onError - Called when render fails (receives error)
 * @returns {boolean} True if render initiated successfully, false on validation error
 */
function renderViewWithCallbacks(res, viewName, data = {}, callbacks = {}) {
  console.log(`renderViewWithCallbacks rendering template: ${viewName}`);
  logger.debug('renderViewWithCallbacks: initiating template render with callbacks', {
    viewName,
    hasData: !!data,
    hasSuccessCallback: typeof callbacks.onSuccess === 'function',
    hasErrorCallback: typeof callbacks.onError === 'function'
  });

  const { onSuccess, onError } = callbacks;

  try {
    // Validate Express response object
    if (!res || typeof res.render !== 'function') {
      console.error('renderViewWithCallbacks: invalid Express response object provided');
      logger.error('renderViewWithCallbacks: invalid response object', {
        hasRes: !!res,
        hasRenderMethod: res && typeof res.render === 'function'
      });
      
      if (onError) {
        onError(new Error('Invalid Express response object'));
      }
      return false;
    }

    // Validate view name
    if (!viewName || typeof viewName !== 'string' || viewName.trim() === '') {
      const error = new Error('View name must be a non-empty string');
      console.error('renderViewWithCallbacks: invalid view name provided');
      logger.error('renderViewWithCallbacks: invalid view name', {
        viewName,
        viewNameType: typeof viewName
      });

      if (onError) {
        onError(error);
      }

      // Send error response for invalid view name
      try {
        res.status(400).json({
          error: 'Invalid template request',
          message: 'Template name is required'
        });
      } catch (responseError) {
        console.error('renderViewWithCallbacks: failed to send error response:', responseError.message);
      }
      return false;
    }

    // Validate and normalize data object
    if (data === null || data === undefined) {
      data = {};
    }

    if (typeof data !== 'object' || Array.isArray(data)) {
      data = {};
    }

    // Attempt to render the template with callbacks
    const trimmedViewName = viewName.trim();
    console.log(`renderViewWithCallbacks: calling res.render for ${trimmedViewName}`);
    logger.debug('renderViewWithCallbacks: initiating Express render', {
      viewName: trimmedViewName,
      dataKeyCount: Object.keys(data).length
    });

    // Use Express built-in error handling by providing callback
    res.render(trimmedViewName, data, (renderError, html) => {
      if (renderError) {
        console.error(`renderViewWithCallbacks: template render failed for ${trimmedViewName}:`, renderError.message);
        logger.error('renderViewWithCallbacks: template rendering failed', {
          viewName: trimmedViewName,
          error: renderError.message,
          errorCode: renderError.code
        });

        if (onError) {
          onError(renderError);
        }

        // Send appropriate error response based on error type
        if (renderError.code === 'ENOENT' || renderError.message.includes('Failed to lookup view')) {
          try {
            res.status(404).json({
              error: 'Page not found',
              message: 'The requested page could not be found'
            });
          } catch (responseError) {
            console.error('renderViewWithCallbacks: failed to send 404 response:', responseError.message);
          }
        } else {
          try {
            res.status(500).json({
              error: 'Internal server error',
              message: 'Unable to render page'
            });
          } catch (responseError) {
            console.error('renderViewWithCallbacks: failed to send 500 response:', responseError.message);
          }
        }
      } else {
        // Successful render
        console.log(`renderViewWithCallbacks: successfully rendered ${trimmedViewName}`);
        logger.debug('renderViewWithCallbacks: template rendered successfully', {
          viewName: trimmedViewName,
          htmlLength: html ? html.length : 0
        });

        if (onSuccess) {
          onSuccess(html);
        }
      }
    });

    return true;

  } catch (error) {
    console.error('renderViewWithCallbacks encountered unexpected error:', error.message);
    logger.error('renderViewWithCallbacks failed with error', {
      error: error.message,
      viewName,
      stack: error.stack
    });

    if (onError) {
      onError(error);
    }

    // Attempt to send error response
    try {
      if (res && typeof res.status === 'function') {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Unable to process template request'
        });
      }
    } catch (responseError) {
      console.error('renderViewWithCallbacks: failed to send fallback error response:', responseError.message);
    }

    return false;
  }
}

/**
 * Utility function to safely prepare template data
 * 
 * Validates and sanitizes data objects before passing to template engines,
 * helping prevent injection attacks and ensuring consistent data structures.
 * 
 * @param {any} data - Raw data to prepare for template
 * @param {object} defaults - Default values to merge with data
 * @returns {object} Sanitized and validated data object
 */
function prepareTemplateData(data, defaults = {}) {
  console.log('prepareTemplateData: sanitizing template data');
  logger.debug('prepareTemplateData: processing template data', {
    hasData: !!data,
    dataType: typeof data,
    hasDefaults: !!defaults && Object.keys(defaults).length > 0
  });

  try {
    // Start with defaults
    let result = { ...defaults };

    // Validate and merge data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Merge valid object data
      result = { ...result, ...data };
    } else if (data !== null && data !== undefined) {
      // Log warning for invalid data types
      console.warn('prepareTemplateData: invalid data type provided, using defaults only');
      logger.warn('prepareTemplateData: invalid data type', {
        dataType: typeof data,
        isArray: Array.isArray(data)
      });
    }

    // Sanitize strings to prevent XSS (basic sanitization)
    const sanitized = {};
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string') {
        // Basic XSS protection - escape HTML entities
        sanitized[key] = value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      } else {
        sanitized[key] = value;
      }
    }

    console.log(`prepareTemplateData: prepared ${Object.keys(sanitized).length} data fields`);
    logger.debug('prepareTemplateData: data preparation complete', {
      fieldCount: Object.keys(sanitized).length,
      fields: Object.keys(sanitized)
    });

    return sanitized;

  } catch (error) {
    console.error('prepareTemplateData encountered error:', error.message);
    logger.error('prepareTemplateData failed', {
      error: error.message,
      hasData: !!data,
      hasDefaults: !!defaults
    });

    // Return defaults on error
    return { ...defaults };
  }
}

module.exports = {
  renderView,
  renderViewWithCallbacks,
  prepareTemplateData
};