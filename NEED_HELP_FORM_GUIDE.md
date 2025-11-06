# Need Help Signing Up Form - Complete Implementation Guide

This guide provides complete details for implementing the "Need Help Signing Up" form feature in the PWA version.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [UI/UX Design](#uiux-design)
3. [Form Structure](#form-structure)
4. [API Integration](#api-integration)
5. [Service Types](#service-types)
6. [Validation Rules](#validation-rules)
7. [State Management](#state-management)
8. [Complete Code Examples](#complete-code-examples)
9. [Testing Checklist](#testing-checklist)

---

## 🎯 Overview

The "Need Help Signing Up" form allows sellers to request assistance during the registration/onboarding process. The form collects contact information, service type, optional fee, and notes.

### Features:
- Modal-based form
- Dynamic contact field display (show/hide based on registration state)
- Service picker with predefined options
- Optional fee input
- Notes/description field
- Full validation
- Success/error handling

---

## 🎨 UI/UX Design

### Location
- **Button Location**: Registration screen header, next to "View Benefits"
- **Button Text**: "Need Help?"
- **Button Style**: Link/underline style, primary color

### Modal Design
- **Type**: Bottom sheet / Slide-up modal
- **Overlay**: Semi-transparent dark background (rgba(0,0,0,0.5))
- **Animation**: Slide up from bottom
- **Size**: Maximum 90% of screen height
- **Background**: White card with rounded top corners

### Layout Structure
```
┌─────────────────────────────────┐
│  Need Help Signing Up?      [X] │ ← Header
├─────────────────────────────────┤
│  Description text...             │
├─────────────────────────────────┤
│  Full Name *                     │ ← Only if not in registration
│  Email Address *                 │
│  Phone Number *                  │
├─────────────────────────────────┤
│  Select Service *                │ ← Required dropdown
│  Fee (Optional)                  │
│  Additional Notes (Optional)      │
├─────────────────────────────────┤
│  [Cancel]  [Submit Request]      │ ← Footer buttons
└─────────────────────────────────┘
```

---

## 📝 Form Structure

### Form Fields

#### 1. **Contact Details** (Conditional)
These fields are shown ONLY if the user hasn't entered registration details yet.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | Text Input | Yes* | Non-empty, trimmed |
| Email Address | Email Input | Yes* | Valid email format |
| Phone Number | Phone Input | Yes* | Non-empty, trimmed |

*Only required if not pre-filled from registration

#### 2. **Service Selection** (Always Visible)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Service Type | Dropdown/Picker | Yes | Must select from available services |

#### 3. **Optional Fields** (Always Visible)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Fee | Number Input | No | Numeric, >= 0 |
| Notes | Textarea | No | Max length: 500 characters |

---

## 🔌 API Integration

### Endpoint
```
POST /api/seller/help/request
```

### Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {onboarding_token}
```

**Note**: If user is in registration process, use `onboarding_token`. If already registered, use regular auth token.

### Request Payload Structure

```json
{
  "service_type": "store_setup",
  "email": "seller@example.com",
  "phone": "+2348012345678",
  "full_name": "John Doe",
  "fee": 5000,
  "notes": "I need help setting up my store profile and uploading products"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service_type` | string | Yes | Service ID from predefined list |
| `email` | string | Yes | Valid email address |
| `phone` | string | Yes | Phone number |
| `full_name` | string | Yes | User's full name |
| `fee` | number/null | No | Service fee (if 0 or null, use service default) |
| `notes` | string/null | No | Additional information (max 500 chars) |

### Response Structure

#### Success Response
```json
{
  "status": "success",
  "message": "Your help request has been submitted successfully. Our team will contact you shortly.",
  "data": {
    "id": 123,
    "service_type": "store_setup",
    "status": "pending",
    "created_at": "2025-11-02T19:00:51.000000Z"
  }
}
```

#### Error Response
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required"],
    "service_type": ["The service type field is required"]
  }
}
```

---

## 🛠️ Service Types

### Available Services

```javascript
const helpServices = [
  {
    id: "store_setup",
    label: "Store Setup Assistance",
    fee: 5000,  // Default fee in Naira
    description: "Help with initial store setup and configuration"
  },
  {
    id: "profile_media",
    label: "Profile & Media Upload",
    fee: 3000,
    description: "Assistance with uploading profile images and banners"
  },
  {
    id: "business_docs",
    label: "Business Documentation",
    fee: 7000,
    description: "Help with business registration documents"
  },
  {
    id: "store_config",
    label: "Store Configuration",
    fee: 4000,
    description: "Assistance with store settings and configuration"
  },
  {
    id: "complete_setup",
    label: "Complete Setup Service",
    fee: 15000,
    description: "Full end-to-end setup assistance"
  },
  {
    id: "custom",
    label: "Custom Service",
    fee: 0,  // User must enter custom fee
    description: "Custom assistance request"
  }
];
```

### Service Picker UI
- Dropdown/Bottom sheet selector
- Show service label and default fee
- Selected service highlighted
- Chevron icon for dropdown indication

---

## ✅ Validation Rules

### Client-Side Validation

#### 1. Contact Details (if not pre-filled)
```javascript
// Full Name
- Required if not from registration
- Must be non-empty after trim
- Error: "Please enter your full name"

// Email
- Required if not from registration
- Must be non-empty after trim
- Must match email regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Error: "Please enter a valid email address"

// Phone
- Required if not from registration
- Must be non-empty after trim
- Error: "Please enter your phone number"
```

#### 2. Service Selection
```javascript
// Service Type
- Required
- Must select from helpServices array
- Error: "Please select a service"
```

#### 3. Optional Fields
```javascript
// Fee
- Optional
- If provided, must be numeric
- Must be >= 0
- If empty, use service default fee
- Error: "Fee must be a valid number"

// Notes
- Optional
- Max length: 500 characters
- Trim whitespace
```

### Validation Flow
```
1. Check if service_type is selected
2. Validate contact details (if not pre-filled)
3. Validate email format (if provided)
4. Validate fee (if provided)
5. Trim all text inputs
6. Proceed to API call
```

---

## 🗂️ State Management

### Required State Variables

```javascript
// Modal visibility
const [showHelpForm, setShowHelpForm] = useState(false);

// Form fields
const [selectedService, setSelectedService] = useState("");
const [helpFee, setHelpFee] = useState("");
const [helpNotes, setHelpNotes] = useState("");

// Contact details (if not from registration)
const [formEmail, setFormEmail] = useState(email || "");
const [formPhone, setFormPhone] = useState(phone || "");
const [formFullName, setFormFullName] = useState(fullName || "");

// Service picker
const [showServicePicker, setShowServicePicker] = useState(false);

// Submission state
const [isSubmitting, setIsSubmitting] = useState(false);
```

### Derived Values

```javascript
// Check if user has registration details
const hasRegistrationDetails = email && phone && fullName;

// Get selected service details
const service = helpServices.find((s) => s.id === selectedService);

// Calculate fee amount
const feeAmount = helpFee ? parseFloat(helpFee) : (service?.fee || 0);
```

---

## 💻 Complete Code Examples

### 1. API Function (Backend Integration)

```javascript
// utils/api/helpRequest.js

import { apiCall } from "./customApiCall";
import { API_ENDPOINTS } from "../apiConfig";

/**
 * Submit help request
 * @param {Object} payload - Request payload
 * @param {string} token - Authentication token (onboarding_token or auth_token)
 * @returns {Promise<Object>} API response
 */
export const submitHelpRequest = async (payload, token) => {
  const url = API_ENDPOINTS.SELLER.Help_Request; // POST /api/seller/help/request
  
  return await apiCall(url, "POST", payload, token);
};
```

### 2. Help Services Configuration

```javascript
// constants/helpServices.js

export const helpServices = [
  { id: "store_setup", label: "Store Setup Assistance", fee: 5000 },
  { id: "profile_media", label: "Profile & Media Upload", fee: 3000 },
  { id: "business_docs", label: "Business Documentation", fee: 7000 },
  { id: "store_config", label: "Store Configuration", fee: 4000 },
  { id: "complete_setup", label: "Complete Setup Service", fee: 15000 },
  { id: "custom", label: "Custom Service", fee: 0 },
];
```

### 3. Form Component Structure (React)

```javascript
// components/NeedHelpFormModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { submitHelpRequest } from '../utils/api/helpRequest';
import { helpServices } from '../constants/helpServices';

function NeedHelpFormModal({
  visible,
  onClose,
  theme,
  email,      // From registration (optional)
  phone,      // From registration (optional)
  fullName,   // From registration (optional)
  onboardingToken,  // Or auth token
}) {
  // State management
  const [selectedService, setSelectedService] = useState("");
  const [helpFee, setHelpFee] = useState("");
  const [helpNotes, setHelpNotes] = useState("");
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields (pre-filled or empty)
  const [formEmail, setFormEmail] = useState(email || "");
  const [formPhone, setFormPhone] = useState(phone || "");
  const [formFullName, setFormFullName] = useState(fullName || "");

  // Update form when props change
  useEffect(() => {
    if (email) setFormEmail(email);
    if (phone) setFormPhone(phone);
    if (fullName) setFormFullName(fullName);
  }, [email, phone, fullName]);

  // Check if registration details exist
  const hasRegistrationDetails = email && phone && fullName;

  // Validation function
  const validateForm = () => {
    if (!selectedService) {
      Alert.alert("Error", "Please select a service");
      return false;
    }

    if (!hasRegistrationDetails) {
      if (!formEmail.trim()) {
        Alert.alert("Error", "Please enter your email address");
        return false;
      }
      
      if (!formPhone.trim()) {
        Alert.alert("Error", "Please enter your phone number");
        return false;
      }
      
      if (!formFullName.trim()) {
        Alert.alert("Error", "Please enter your full name");
        return false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail.trim())) {
        Alert.alert("Error", "Please enter a valid email address");
        return false;
      }
    }

    return true;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const service = helpServices.find((s) => s.id === selectedService);
    const feeAmount = helpFee ? parseFloat(helpFee) : (service?.fee || 0);

    setIsSubmitting(true);

    try {
      const payload = {
        service_type: selectedService,
        email: hasRegistrationDetails ? email : formEmail.trim(),
        phone: hasRegistrationDetails ? phone : formPhone.trim(),
        full_name: hasRegistrationDetails ? fullName : formFullName.trim(),
        fee: feeAmount > 0 ? feeAmount : null,
        notes: helpNotes.trim() || null,
      };

      const response = await submitHelpRequest(payload, onboardingToken);

      if (response.status === "success" || response.status === true) {
        Alert.alert(
          "Request Submitted",
          response.message || `Your help request for "${service?.label}" has been submitted. Our team will contact you shortly.${feeAmount > 0 ? `\n\nEstimated fee: ₦${feeAmount.toLocaleString()}` : ""}`,
          [{ 
            text: "OK", 
            onPress: () => {
              // Reset form
              setSelectedService("");
              setHelpFee("");
              setHelpNotes("");
              setFormEmail("");
              setFormPhone("");
              setFormFullName("");
              onClose();
            }
          }]
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to submit help request. Please try again."
        );
      }
    } catch (error) {
      console.error("Submit help request error:", error);
      Alert.alert(
        "Error",
        error.message || error.response?.data?.message || "Failed to submit help request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>
              Need Help Signing Up?
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#101318" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={styles.description}>
              Our team can help you complete your store registration. Select a service below and we'll assist you.
            </Text>

            {/* Contact Details - Conditional */}
            {!hasRegistrationDetails && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Full Name <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={formFullName}
                    onChangeText={setFormFullName}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Email Address <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formEmail}
                    onChangeText={setFormEmail}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Phone Number <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    value={formPhone}
                    onChangeText={setFormPhone}
                  />
                </View>
              </>
            )}

            {/* Service Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Select Service <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowServicePicker(true)}
              >
                <Text style={[styles.pickerText, !selectedService && { color: "#9AA0A6" }]}>
                  {selectedService
                    ? helpServices.find((s) => s.id === selectedService)?.label
                    : "Choose a service"}
                </Text>
                <Icon name="chevron-down" size={20} color="#9AA0A6" />
              </TouchableOpacity>
            </View>

            {/* Fee Input */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Fee (Optional)
                {selectedService && (
                  <Text style={{ color: "#6C727A", fontWeight: "400" }}>
                    {" "}Default: ₦{helpServices.find((s) => s.id === selectedService)?.fee?.toLocaleString() || 0}
                  </Text>
                )}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter custom fee (optional)"
                keyboardType="decimal-pad"
                value={helpFee}
                onChangeText={setHelpFee}
              />
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Tell us what specific help you need..."
                multiline
                numberOfLines={4}
                maxLength={500}
                value={helpNotes}
                onChangeText={setHelpNotes}
              />
              <Text style={styles.charCount}>
                {helpNotes.length}/500 characters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Service Picker Modal */}
          <Modal
            visible={showServicePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowServicePicker(false)}
          >
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContent}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerHeaderTitle}>Select Service</Text>
                  <TouchableOpacity onPress={() => setShowServicePicker(false)}>
                    <Icon name="close" size={24} color="#101318" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {helpServices.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedService(service.id);
                        setShowServicePicker(false);
                      }}
                    >
                      <View>
                        <Text style={styles.pickerItemLabel}>{service.label}</Text>
                        <Text style={styles.pickerItemFee}>
                          Default fee: ₦{service.fee.toLocaleString()}
                        </Text>
                      </View>
                      {selectedService === service.id && (
                        <Icon name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}
```

### 4. Integration in Registration Screen

```javascript
// screens/RegisterScreen.jsx

import { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import NeedHelpFormModal from '../components/NeedHelpFormModal';

function RegisterScreen() {
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [helpFee, setHelpFee] = useState("");
  const [helpNotes, setHelpNotes] = useState("");

  // Your registration state
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [onboardingToken, setOnboardingToken] = useState(null);

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text>Register</Text>
        <TouchableOpacity onPress={() => setShowHelpForm(true)}>
          <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
            Need Help?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Registration Form */}
      {/* ... your registration fields ... */}

      {/* Help Form Modal */}
      <NeedHelpFormModal
        visible={showHelpForm}
        onClose={() => setShowHelpForm(false)}
        theme={theme}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        helpFee={helpFee}
        setHelpFee={setHelpFee}
        helpNotes={helpNotes}
        setHelpNotes={setHelpNotes}
        email={storeEmail}
        phone={storePhone}
        fullName={storeName}
        onboardingToken={onboardingToken}
      />
    </View>
  );
}
```

---

## 🎨 CSS Styles (For Web/PWA)

```css
/* Modal Overlay */
.help-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  z-index: 1000;
}

/* Modal Content */
.help-form-content {
  background-color: #fff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  max-height: 90vh;
  width: 100%;
  padding-bottom: 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

/* Header */
.help-form-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ECEEF2;
}

.help-form-title {
  font-size: 18px;
  font-weight: 700;
  color: #101318;
}

/* Form Fields */
.help-form-field {
  padding: 0 20px;
  margin-bottom: 20px;
}

.help-form-label {
  font-size: 14px;
  font-weight: 600;
  color: #101318;
  margin-bottom: 8px;
}

.help-form-input {
  width: 100%;
  height: 48px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 15px;
  color: #101318;
  background-color: #F9FAFB;
}

.help-form-textarea {
  width: 100%;
  min-height: 100px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: #101318;
  background-color: #F9FAFB;
  resize: vertical;
}

/* Service Picker */
.help-form-picker {
  width: 100%;
  height: 48px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 0 16px;
  background-color: #F9FAFB;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

/* Submit Button */
.help-form-submit {
  margin: 10px 20px;
  padding: 16px;
  border-radius: 12px;
  background-color: #EF4444;
  align-items: center;
  justify-content: center;
}

.help-form-submit:disabled {
  opacity: 0.6;
}
```

---

## ✅ Testing Checklist

### Functional Testing
- [ ] Modal opens when "Need Help?" is clicked
- [ ] Modal closes when X button is clicked
- [ ] Modal closes when overlay is clicked (if implemented)
- [ ] Contact fields show only when registration details are missing
- [ ] Contact fields are pre-filled when registration details exist
- [ ] Service picker opens and displays all services
- [ ] Service selection updates form
- [ ] Default fee displays when service is selected
- [ ] Custom fee input works correctly
- [ ] Character counter works for notes (500 max)
- [ ] Form validation works for all fields
- [ ] Email validation works correctly
- [ ] Submit button is disabled during submission
- [ ] Success message displays on successful submission
- [ ] Error message displays on failed submission
- [ ] Form resets after successful submission

### API Testing
- [ ] Request payload matches API requirements
- [ ] Authorization token is sent correctly
- [ ] Success response is handled correctly
- [ ] Error response is handled correctly
- [ ] Network errors are handled gracefully
- [ ] Loading state displays during API call

### UI/UX Testing
- [ ] Modal animations work smoothly
- [ ] Form is scrollable on small screens
- [ ] Input fields are accessible
- [ ] Placeholder text is clear
- [ ] Error messages are user-friendly
- [ ] Success message is informative
- [ ] Responsive design works on all screen sizes

---

## 🔗 Related Files

### Mobile App Implementation
- Component: `screens/authscreens/RegisterScreen.jsx` (NeedHelpFormModal)
- API Function: `utils/mutations/seller.js` (submitHelpRequest)
- API Endpoint: `apiConfig.js` (Help_Request)

### API Endpoint
```
POST /api/seller/help/request
```

---

## 📝 Notes for Implementation

1. **Token Handling**: Use `onboarding_token` during registration, regular `auth_token` after registration
2. **Conditional Fields**: Only show contact fields if user hasn't entered registration details
3. **Fee Logic**: If fee is not provided, use service default fee
4. **Validation**: All client-side validation should match backend validation rules
5. **Error Messages**: Display user-friendly error messages from API
6. **Success Handling**: Clear form and close modal after successful submission

---

## 🐛 Common Issues & Solutions

### Issue: Modal doesn't close on submission
**Solution**: Ensure `onClose()` is called in the success callback

### Issue: Form fields not pre-filling
**Solution**: Check that `email`, `phone`, and `fullName` props are being passed correctly

### Issue: API returns 401 Unauthorized
**Solution**: Verify that correct token (onboarding_token vs auth_token) is being used

### Issue: Validation errors not showing
**Solution**: Check that validation function is called before API submission

---

**Last Updated**: 2025-11-02
**Version**: 1.0
**Author**: Implementation Guide for PWA Development


