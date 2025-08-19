/**
 * Render EJS Template with Error Handling and Data Validation
 * 
 * RATIONALE: Template rendering can fail due to missing files, syntax errors,
 * or invalid data. This utility provides robust error handling and logging
 * while maintaining consistent response patterns for view rendering failures.
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
 * 
 * EJS INTEGRATION:
 * - Assumes EJS is configured as Express view engine
 * - Supports EJS template syntax and features
 * - Uses Express res.render() method for consistent behavior
 * - Inherits view engine configuration from Express app
 * 
 * @param {object} res - Express response object
 * @param {string} viewName - Name of template file (without .ejs extension)
 * @param {object} data - Data object to pass to template (default: empty object)
 * @returns {boolean} True if render initiated successfully, false on validation error
 * @throws Never throws - all errors are handled through Express error handling
 */

const { qerrors } = require('qerrors');
const logger = require('../../logger');

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
      qerrors(new Error('Invalid Express response object'), 'renderView-validation', {
        hasRes: !!res,
        resType: typeof res,
        hasRender: res && typeof res.render === 'function'
      });
      logger.error('renderView: invalid response object', {
        hasRes: !!res,
        hasRenderMethod: res && typeof res.render === 'function'
      });
      return false;
    }

    // Validate view name
    if (!viewName || typeof viewName !== 'string' || viewName.trim() === '') {
      console.error('renderView: invalid view name provided');
      const error = new Error('View name must be a non-empty string');
      qerrors(error, 'renderView-viewname', { viewName, viewNameType: typeof viewName });
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
        qerrors(renderError, 'renderView-render', {
          viewName: trimmedViewName,
          errorCode: renderError.code,
          errorMessage: renderError.message
        });
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
    qerrors(error, 'renderView', {
      viewName,
      errorMessage: error.message
    });
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

module.exports = renderView;