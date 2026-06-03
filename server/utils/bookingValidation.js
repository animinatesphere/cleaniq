/**
 * BOOKING FORM VALIDATION SCHEMA & HELPER FUNCTIONS
 * Location: server/utils/bookingValidation.js
 */

// Validation Schema
export const bookingValidationSchema = {
  customer: {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: "First name must be 2-50 characters (letters only)",
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: "Last name must be 2-50 characters (letters only)",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Invalid email address",
    },
    phone: {
      required: true,
      minLength: 10,
      pattern: /^[\d\s\-\+\(\)]+$/,
      message: "Phone must be 10+ digits",
    },
  },
  service: {
    required: true,
    message: "Service type must be selected",
  },
  details: {
    address: {
      required: true,
      minLength: 5,
      maxLength: 200,
      message: "Address must be 5-200 characters",
    },
    frequency: {
      required: true,
      enum: ["Once", "Weekly", "Bi-weekly", "Monthly"],
      message: "Valid frequency must be selected",
    },
    duration: {
      required: true,
      type: "number",
      min: 0.5,
      max: 8,
      message: "Duration must be between 0.5 and 8 hours",
    },
    bedrooms: {
      type: "number",
      min: 0,
      max: 10,
      message: "Bedrooms must be 0-10",
    },
    bathrooms: {
      type: "number",
      min: 0,
      max: 10,
      message: "Bathrooms must be 0-10",
    },
  },
  schedule: {
    date: {
      required: true,
      type: "date",
      notPast: true,
      message: "Date must be today or in the future",
    },
    timeSlot: {
      required: true,
      enum: ["Morning", "Afternoon", "Evening"],
      message: "Valid time slot must be selected",
    },
    preferredTime: {
      type: "string",
      maxLength: 100,
    },
  },
  payment: {
    amount: {
      required: true,
      type: "number",
      min: 0.01,
      message: "Amount must be greater than 0",
    },
    currency: {
      required: true,
      enum: ["GBP"],
      message: "Valid currency must be selected",
    },
  },
};

// Validation Functions
export const validateField = (fieldName, value, schema) => {
  const rules = getNestedValue(schema, fieldName);
  if (!rules) return { valid: true };

  // Check required
  if (rules.required && !value) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (!value) return { valid: true };

  // Check pattern
  if (rules.pattern && !rules.pattern.test(String(value))) {
    return {
      valid: false,
      error: rules.message || `${fieldName} format is invalid`,
    };
  }

  // Check min length
  if (rules.minLength && String(value).length < rules.minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${rules.minLength} characters`,
    };
  }

  // Check max length
  if (rules.maxLength && String(value).length > rules.maxLength) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${rules.maxLength} characters`,
    };
  }

  // Check number min
  if (rules.min !== undefined && Number(value) < rules.min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${rules.min}`,
    };
  }

  // Check number max
  if (rules.max !== undefined && Number(value) > rules.max) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${rules.max}`,
    };
  }

  // Check enum
  if (rules.enum && !rules.enum.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${rules.enum.join(", ")}`,
    };
  }

  // Check date not in past
  if (rules.notPast && new Date(value) < new Date().setHours(0, 0, 0, 0)) {
    return { valid: false, error: `${fieldName} cannot be in the past` };
  }

  return { valid: true };
};

// Validate entire booking object
export const validateBooking = (booking) => {
  const errors = {};
  let isValid = true;

  // Validate customer
  ["firstName", "lastName", "email", "phone"].forEach((field) => {
    const result = validateField(
      `customer.${field}`,
      booking.customer?.[field],
      bookingValidationSchema,
    );
    if (!result.valid) {
      errors[`customer.${field}`] = result.error;
      isValid = false;
    }
  });

  // Validate service
  const serviceResult = validateField(
    "service",
    booking.service,
    bookingValidationSchema,
  );
  if (!serviceResult.valid) {
    errors.service = serviceResult.error;
    isValid = false;
  }

  // Validate details
  ["address", "frequency", "duration"].forEach((field) => {
    const result = validateField(
      `details.${field}`,
      booking.details?.[field],
      bookingValidationSchema,
    );
    if (!result.valid) {
      errors[`details.${field}`] = result.error;
      isValid = false;
    }
  });

  // Validate schedule
  ["date", "timeSlot"].forEach((field) => {
    const result = validateField(
      `schedule.${field}`,
      booking.schedule?.[field],
      bookingValidationSchema,
    );
    if (!result.valid) {
      errors[`schedule.${field}`] = result.error;
      isValid = false;
    }
  });

  // Validate payment
  ["amount", "currency"].forEach((field) => {
    const result = validateField(
      `payment.${field}`,
      booking.payment?.[field],
      bookingValidationSchema,
    );
    if (!result.valid) {
      errors[`payment.${field}`] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Helper function to get nested object value
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, prop) => current?.[prop], obj);
};

// Get all validation errors for a form step
export const getStepErrors = (step, formData) => {
  const errors = {};

  switch (step) {
    case 1: // Location & Service
      ["address", "frequency", "service"].forEach((field) => {
        if (field === "service") {
          const result = validateField(
            field,
            formData.service,
            bookingValidationSchema,
          );
          if (!result.valid) errors[field] = result.error;
        } else {
          const result = validateField(
            `details.${field}`,
            formData.details?.[field],
            bookingValidationSchema,
          );
          if (!result.valid) errors[`details.${field}`] = result.error;
        }
      });
      break;

    case 2: // Property & Duration
      ["duration", "bedrooms", "bathrooms"].forEach((field) => {
        const result = validateField(
          `details.${field}`,
          formData.details?.[field],
          bookingValidationSchema,
        );
        if (!result.valid) errors[`details.${field}`] = result.error;
      });
      break;

    case 3: // Extras (mostly optional, but can validate if required)
      // Extras validation is mostly optional
      break;

    case 4: // Schedule & Payment
      ["date", "timeSlot"].forEach((field) => {
        const result = validateField(
          `schedule.${field}`,
          formData.schedule?.[field],
          bookingValidationSchema,
        );
        if (!result.valid) errors[`schedule.${field}`] = result.error;
      });

      ["firstName", "lastName", "email", "phone"].forEach((field) => {
        const result = validateField(
          `customer.${field}`,
          formData.customer?.[field],
          bookingValidationSchema,
        );
        if (!result.valid) errors[`customer.${field}`] = result.error;
      });

      ["amount", "currency"].forEach((field) => {
        const result = validateField(
          `payment.${field}`,
          formData.payment?.[field],
          bookingValidationSchema,
        );
        if (!result.valid) errors[`payment.${field}`] = result.error;
      });
      break;
  }

  return errors;
};

// Check if step can proceed
export const canProceedToNextStep = (step, formData) => {
  const errors = getStepErrors(step, formData);
  return Object.keys(errors).length === 0;
};

/**
 * USAGE IN REACT COMPONENT:
 *
 * import { canProceedToNextStep, getStepErrors } from './bookingValidation';
 *
 * const handleNextStep = () => {
 *   const errors = getStepErrors(createStep, createData);
 *   if (Object.keys(errors).length > 0) {
 *     setFormErrors(errors);
 *     setStatusMessage({ type: 'error', text: 'Please fix errors before proceeding' });
 *     return;
 *   }
 *   setCreateStep(createStep + 1);
 * };
 *
 * // Show error for a field:
 * {formErrors[`details.address`] && (
 *   <p className="text-rose-500 text-xs mt-1">{formErrors[`details.address`]}</p>
 * )}
 */
