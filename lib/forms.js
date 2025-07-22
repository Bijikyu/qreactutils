/**
 * Form State Management and Field Components Module
 * 
 * This module provides comprehensive form state management utilities and
 * reusable form field components. Focuses on reducing form boilerplate
 * while providing consistent styling and behavior across form inputs.
 * Includes both controlled input handling and pre-styled field components.
 */

const React = require('react'); // React hooks and component creation
const { useState } = React;
const { cn } = require('./classNames'); // class name merging utility

/**
 * Custom hook for form state management
 * 
 * Manages form state with convenient utilities for handling input changes,
 * setting individual fields, and resetting the entire form. Provides a
 * clean API for controlled form inputs with minimal boilerplate.
 * 
 * Handles common form patterns like input change events, programmatic
 * field updates, and form reset functionality. Works with any form
 * structure by accepting a generic initial state object.
 * 
 * @param {Object} initialState - Initial form state object
 * @returns {Object} Form utilities and state
 * @returns {Object} returns.form - Current form state
 * @returns {Function} returns.setForm - Set entire form state
 * @returns {Function} returns.handleChange - Handle input change events
 * @returns {Function} returns.setField - Set individual field value
 * @returns {Function} returns.resetForm - Reset form to initial state
 * 
 * @example
 * // Basic usage
 * const { form, handleChange, setField, resetForm } = useForm({
 *   name: '',
 *   email: '',
 *   age: 0
 * });
 * 
 * @example
 * // In JSX
 * <input
 *   name="email"
 *   value={form.email}
 *   onChange={handleChange}
 * />
 * 
 * @example
 * // Programmatic updates
 * setField('name', 'John Doe');
 * resetForm(); // Back to initial state
 */
function useForm(initialState) {
  const [form, setForm] = useState(initialState);
  
  // Handle input change events (input, textarea, select)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Handle checkboxes and radio buttons
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setForm(prev => ({ ...prev, [name]: fieldValue }));
  };
  
  // Set individual field value programmatically
  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset form to initial state
  const resetForm = () => setForm(initialState);
  
  return {
    form,      // current form state
    setForm,   // set entire form state
    handleChange, // handle input change events
    setField,  // set individual field
    resetForm  // reset to initial state
  };
}

/**
 * Base form field wrapper component
 * 
 * Provides consistent styling and structure for form fields with label
 * and spacing. Acts as a container for various input types while
 * maintaining uniform appearance and accessibility patterns.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Field label text
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Input component to wrap
 * @returns {React.Element} Form field wrapper
 * 
 * @example
 * <FormField label="Email Address">
 *   <input type="email" name="email" />
 * </FormField>
 */
function FormField({ label, className, children }) {
  return React.createElement(
    'div',
    { className: cn('space-y-2', className) },
    React.createElement(
      'label',
      { className: 'block text-sm font-medium text-gray-300 mb-1' },
      label
    ),
    children
  );
}

/**
 * Pre-styled text input field component
 * 
 * Complete text input field with label and consistent styling.
 * Handles all standard input types (text, email, password, etc.)
 * with focus states and proper accessibility structure.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {...Object} props - All other HTML input attributes
 * @returns {React.Element} Styled text input field
 * 
 * @example
 * <TextInputField
 *   label="Full Name"
 *   name="name"
 *   type="text"
 *   value={form.name}
 *   onChange={handleChange}
 *   placeholder="Enter your name"
 * />
 */
function TextInputField({ label, className, ...props }) {
  return React.createElement(
    FormField,
    { label, className },
    React.createElement('input', {
      className: cn(
        'w-full bg-dark-quaternary border border-gray-600 rounded-md px-3 py-2',
        'text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50',
        'focus:border-teal-500 transition-colors duration-200'
      ),
      ...props
    })
  );
}

/**
 * Pre-styled textarea field component
 * 
 * Multi-line text input with consistent styling and label structure.
 * Supports all standard textarea attributes like rows, cols, resize, etc.
 * Maintains the same visual design as other form components.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Textarea label
 * @param {...Object} props - All other HTML textarea attributes
 * @returns {React.Element} Styled textarea field
 * 
 * @example
 * <TextareaField
 *   label="Description"
 *   name="description"
 *   rows={4}
 *   value={form.description}
 *   onChange={handleChange}
 *   placeholder="Enter description..."
 * />
 */
function TextareaField({ label, className, ...props }) {
  return React.createElement(
    FormField,
    { label, className },
    React.createElement('textarea', {
      className: cn(
        'w-full bg-dark-quaternary border border-gray-600 rounded-md px-3 py-2',
        'text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50',
        'focus:border-teal-500 resize-vertical transition-colors duration-200'
      ),
      ...props
    })
  );
}

/**
 * Pre-styled select dropdown field component
 * 
 * Select dropdown with options and consistent styling. Takes an array
 * of option objects and renders them as HTML option elements.
 * Supports all standard select attributes and maintains design consistency.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Select label
 * @param {Array<{value: string, label: string}>} props.options - Select options
 * @param {...Object} props - All other HTML select attributes
 * @returns {React.Element} Styled select field
 * 
 * @example
 * <SelectField
 *   label="Country"
 *   name="country"
 *   value={form.country}
 *   onChange={handleChange}
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' }
 *   ]}
 * />
 */
function SelectField({ label, options, className, ...props }) {
  return React.createElement(
    FormField,
    { label, className },
    React.createElement(
      'select',
      {
        className: cn(
          'w-full bg-dark-quaternary border border-gray-600 rounded-md px-3 py-2',
          'text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50',
          'focus:border-teal-500 cursor-pointer transition-colors duration-200'
        ),
        ...props
      },
      options.map(option =>
        React.createElement(
          'option',
          {
            key: option.value,
            value: option.value
          },
          option.label
        )
      )
    )
  );
}

/**
 * Checkbox field component with label
 * 
 * Styled checkbox input with proper label association and consistent
 * appearance. Handles boolean form values and provides accessible
 * checkbox interaction patterns.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Checkbox label
 * @param {...Object} props - All other HTML input attributes
 * @returns {React.Element} Styled checkbox field
 * 
 * @example
 * <CheckboxField
 *   label="I agree to the terms"
 *   name="agreedToTerms"
 *   checked={form.agreedToTerms}
 *   onChange={handleChange}
 * />
 */
function CheckboxField({ label, className, ...props }) {
  return React.createElement(
    'div',
    { className: cn('flex items-center space-x-2', className) },
    React.createElement('input', {
      type: 'checkbox',
      className: cn(
        'h-4 w-4 text-teal-500 bg-dark-quaternary border border-gray-600',
        'rounded focus:ring-2 focus:ring-teal-500/50'
      ),
      ...props
    }),
    React.createElement(
      'label',
      { className: 'text-sm font-medium text-gray-300' },
      label
    )
  );
}

/**
 * Form validation utility functions
 * 
 * Collection of common validation functions that can be used with forms
 * to validate field values and provide consistent error messages.
 */
const formValidation = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate required field
   * @param {*} value - Value to validate
   * @returns {boolean} True if value exists and is not empty
   */
  isRequired: (value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    return value != null && value !== undefined;
  },

  /**
   * Validate minimum length
   * @param {string} value - String to validate
   * @param {number} minLength - Minimum required length
   * @returns {boolean} True if meets minimum length
   */
  minLength: (value, minLength) => {
    return typeof value === 'string' && value.length >= minLength;
  },

  /**
   * Validate maximum length
   * @param {string} value - String to validate
   * @param {number} maxLength - Maximum allowed length
   * @returns {boolean} True if under maximum length
   */
  maxLength: (value, maxLength) => {
    return typeof value === 'string' && value.length <= maxLength;
  },

  /**
   * Validate number range
   * @param {number} value - Number to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} True if within range
   */
  inRange: (value, min, max) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num >= min && num <= max;
  }
};

/**
 * Form submission utility with loading state and error handling
 * 
 * Manages form submission state including loading indicators and error
 * handling. Provides a consistent pattern for async form submissions
 * with proper state management.
 * 
 * @param {Function} submitFn - Async function to handle form submission
 * @returns {Object} Submission utilities
 * 
 * @example
 * const { handleSubmit, isSubmitting, submitError } = useFormSubmission(
 *   async (formData) => {
 *     const response = await api.post('/users', formData);
 *     return response.data;
 *   }
 * );
 */
function useFormSubmission(submitFn) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await submitFn(formData);
      setIsSubmitting(false);
      return result;
    } catch (error) {
      setSubmitError(error.message || 'Submission failed');
      setIsSubmitting(false);
      throw error;
    }
  };

  const resetSubmission = () => {
    setSubmitError(null);
    setIsSubmitting(false);
  };

  return {
    handleSubmit,    // async submission handler
    isSubmitting,    // loading state
    submitError,     // error message if submission failed
    resetSubmission  // reset submission state
  };
}

module.exports = {
  useForm,           // form state management hook // exported for form handling
  useFormSubmission, // form submission with loading and error handling // exported for async form submissions
  formValidation,    // validation utility functions // exported for form validation
  FormField,         // base form field wrapper // exported for custom field creation
  TextInputField,    // styled text input component // exported for text inputs
  TextareaField,     // styled textarea component // exported for multi-line inputs
  SelectField,       // styled select dropdown component // exported for dropdown inputs
  CheckboxField      // styled checkbox component // exported for boolean inputs
};