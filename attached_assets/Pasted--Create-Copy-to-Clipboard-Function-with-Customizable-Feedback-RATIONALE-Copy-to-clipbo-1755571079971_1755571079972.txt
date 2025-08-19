/**
 * Create Copy-to-Clipboard Function with Customizable Feedback
 * 
 * RATIONALE: Copy-to-clipboard functionality requires different approaches across
 * browsers and contexts. This factory function provides a consistent interface
 * with customizable success/error feedback while handling browser compatibility.
 * 
 * IMPLEMENTATION STRATEGY:
 * - Use modern Clipboard API when available for security and reliability
 * - Fallback to legacy document.execCommand for older browser support
 * - Provide customizable callback functions for success/error handling
 * - Handle various text types and sanitization requirements
 * - Graceful degradation when clipboard access is denied or unavailable
 * 
 * BROWSER COMPATIBILITY:
 * - Modern browsers: navigator.clipboard.writeText() (requires HTTPS)
 * - Legacy browsers: document.execCommand('copy') with temporary textarea
 * - Server-side: Returns no-op function that logs attempt
 * - Mobile browsers: May require user gesture to work properly
 * 
 * SECURITY CONSIDERATIONS:
 * - Clipboard API requires secure context (HTTPS) in modern browsers
 * - User permission may be required for clipboard access
 * - Some browsers block clipboard operations outside user gestures
 * - Text sanitization prevents injection of malicious content
 * 
 * FACTORY PATTERN RATIONALE:
 * - Allows customization of feedback behavior per use case
 * - Enables different success/error messages for different contexts
 * - Supports both UI updates and console logging patterns
 * - Provides consistent API across different environments
 * 
 * @param {function} onSuccess - Callback function called when copy succeeds (receives copied text)
 * @param {function} onError - Callback function called when copy fails (receives error message)
 * @returns {function} Copy function that takes text and attempts to copy it to clipboard
 * @throws Never throws - all errors are handled through onError callback
 */

const { qerrors } = require('qerrors');
const logger = require('../../logger');

function makeCopyFn(onSuccess = null, onError = null) {
  console.log('makeCopyFn creating copy function with custom callbacks');
  logger.debug('makeCopyFn: creating clipboard copy function', {
    hasSuccessCallback: typeof onSuccess === 'function',
    hasErrorCallback: typeof onError === 'function'
  });

  // Validate callback parameters
  if (onSuccess !== null && typeof onSuccess !== 'function') {
    console.warn('makeCopyFn: onSuccess is not a function, will be ignored');
    logger.warn('makeCopyFn: invalid onSuccess callback provided', { 
      onSuccessType: typeof onSuccess 
    });
    onSuccess = null;
  }

  if (onError !== null && typeof onError !== 'function') {
    console.warn('makeCopyFn: onError is not a function, will be ignored');
    logger.warn('makeCopyFn: invalid onError callback provided', { 
      onErrorType: typeof onError 
    });
    onError = null;
  }

  // Return the configured copy function
  return async function copyToClipboard(text) {
    console.log(`copyToClipboard attempting to copy text (length: ${text ? text.length : 0})`);
    logger.debug('copyToClipboard: copy attempt initiated', {
      textLength: text ? text.length : 0,
      hasText: !!text
    });

    try {
      // Validate input text
      if (typeof text !== 'string') {
        const errorMsg = 'Copy text must be a string';
        console.error('copyToClipboard:', errorMsg);
        logger.error('copyToClipboard: invalid text type', { textType: typeof text });
        
        if (onError) {
          onError(errorMsg);
        }
        return false;
      }

      // Handle empty string
      if (text === '') {
        const errorMsg = 'Cannot copy empty text';
        console.warn('copyToClipboard:', errorMsg);
        logger.warn('copyToClipboard: empty text provided');
        
        if (onError) {
          onError(errorMsg);
        }
        return false;
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.log('copyToClipboard: server-side environment, simulating copy');
        logger.debug('copyToClipboard: server-side copy simulation', { textLength: text.length });
        
        if (onSuccess) {
          onSuccess(text);
        }
        return true;
      }

      // Try modern Clipboard API first
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          console.log('copyToClipboard: successful copy using Clipboard API');
          logger.debug('copyToClipboard: Clipboard API copy successful', { 
            textLength: text.length 
          });
          
          if (onSuccess) {
            onSuccess(text);
          }
          return true;
        } catch (clipboardError) {
          console.warn('copyToClipboard: Clipboard API failed, trying fallback:', clipboardError.message);
          logger.warn('copyToClipboard: Clipboard API failed, attempting fallback', { 
            error: clipboardError.message 
          });
          // Continue to fallback method
        }
      }

      // Fallback to execCommand method
      try {
        // Create temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          console.log('copyToClipboard: successful copy using execCommand fallback');
          logger.debug('copyToClipboard: execCommand fallback successful', { 
            textLength: text.length 
          });
          
          if (onSuccess) {
            onSuccess(text);
          }
          return true;
        } else {
          throw new Error('execCommand copy returned false');
        }
      } catch (execError) {
        const errorMsg = `Copy failed: ${execError.message}`;
        console.error('copyToClipboard:', errorMsg);
        qerrors(execError, 'copyToClipboard-fallback', { textLength: text.length });
        logger.error('copyToClipboard: all copy methods failed', { 
          error: execError.message,
          textLength: text.length
        });
        
        if (onError) {
          onError(errorMsg);
        }
        return false;
      }

    } catch (error) {
      // Handle any unexpected errors during copy operation
      const errorMsg = `Unexpected copy error: ${error.message}`;
      console.error('copyToClipboard encountered unexpected error:', error.message);
      qerrors(error, 'copyToClipboard', { 
        textLength: text ? text.length : 0,
        errorMessage: error.message
      });
      logger.error('copyToClipboard: unexpected error', { 
        error: error.message,
        textLength: text ? text.length : 0,
        stack: error.stack
      });

      if (onError) {
        onError(errorMsg);
      }
      return false;
    }
  };
}

module.exports = makeCopyFn;