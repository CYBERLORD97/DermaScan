# Requirements Document

## 1. Application Overview

**Application Name**: DermaScan AI

**Description**: DermaScan AI is a web-based skin condition detection application that enables users to upload or capture photos of affected skin areas and receive instant AI-powered analysis. The application provides predicted skin conditions, severity levels, confidence scores, treatment recommendations, and medication suggestions tailored to the Nigerian pharmaceutical market with pricing in Naira. The primary goal is to help users identify skin issues early, avoid incorrect self-diagnosis, obtain proper medications, and take appropriate next steps quickly.

**Visual Design Reference**: Follow the Figma design at https://www.figma.com/design/ukGizSmctjAJteN22O8Knk/DermaScan-AI?node-id=0-1&t=2v6NtO8Xix8ydcKN-1 for visual identity of each page.

---

## 2. Users and Usage Scenarios

**Target Users**: Individuals in Nigeria seeking to identify and understand skin conditions through accessible digital tools.

**Core Usage Scenarios**:

- Users notice unusual skin changes and want quick preliminary assessment
- Users need guidance on appropriate medications available in Nigerian pharmacies
- Users want to understand severity levels before deciding whether to seek professional medical consultation
- Users want to review past AI dermatologist chat conversations
- Users want to view and manage their booked dermatologist appointments
- Users want to quickly access AI dermatologist chatbot for skin-related questions
- Users want to resume previous chat conversations
- Users need to reschedule confirmed appointments

---

## 3. Page Structure and Functional Description

### 3.1 Page Structure

```
DermaScan AI
├── Registration Page
├── Login Page
├── Home Page
│   └── Floating Chatbot FAB
├── Photo Input Page
├── Processing Overlay
├── Analysis Results Page
├── Medication Details Page
├── My Appointments Page
│   ├── Reschedule Dialog
│   └── Status Change Notification Banner
└── Profile Page
    └── Chat History Section
        └── Continue Button
```

### 3.2 Functional Description by Page

#### 3.2.1 Registration Page

**Purpose**: Allow new users to create an account.

**Key Functions**:

- User inputs email and password to complete registration
- System stores user account information

---

#### 3.2.2 Login Page

**Purpose**: Allow registered users to access the application.

**Key Functions**:

- User inputs email and password to log in
- System authenticates user credentials and grants access

---

#### 3.2.3 Home Page

**Purpose**: Provide a clean, minimal dashboard-style interface with four primary action cards for quick navigation.

**Key Functions**:

- **Scan Card**: Navigate to Photo Input Page with camera capture mode enabled
- **Upload Card**: Navigate to Photo Input Page with image upload mode enabled
- **History Card**: Navigate to user's past analysis records
- **About Card**: Navigate to application information and usage guidance
- **Floating Chatbot FAB**: Display a persistent floating action button in the bottom-right corner that opens the DermatologistChatPage when clicked, allowing users to access AI dermatologist chatbot without scanning first

---

#### 3.2.4 Photo Input Page

**Purpose**: Allow users to provide skin condition images and optional text descriptions for analysis.

**Key Functions**:

- **Photo Capture**: Users activate device camera to take a photo of the affected skin area
- **Photo Upload**: Users select and upload an existing image from their device using the image-upload skill
- **Image Preview**: Display the selected or captured image before submission
- **Text Description Input**: Users can optionally enter text description of their skin condition including symptoms, duration, pain level, and other relevant details
- **Submit for Analysis**: Trigger AI analysis process after user confirms the image and optional text description

---

#### 3.2.5 Processing Overlay

**Purpose**: Provide visual feedback during image upload and AI analysis process.

**Key Functions**:

- Display full-screen processing overlay after user submits image and optional text description
- Show animated loading indicators
- Display visual status steps including:
  - Uploading image...
  - Analyzing with AI...
  - Generating recommendations...
- Automatically dismiss overlay and navigate to Analysis Results Page when processing completes

---

#### 3.2.6 Analysis Results Page

**Purpose**: Display AI-powered analysis results and provide actionable recommendations.

**Key Functions**:

- **Predicted Skin Condition Name**: Display the identified skin condition
- **Severity Level**: Show severity classification (mild, moderate, or severe)
- **Confidence Score**: Present the AI prediction confidence as a percentage
- **Treatment Recommendations**: Provide general treatment guidance for the identified condition
- **Medication Recommendations**: List medications available in the Nigerian market with the following details:
  - Medication name
  - Price level (low, medium, or high) displayed as visual indicators
  - Effectiveness rating
- **Next Steps Guidance**: Suggest whether professional medical consultation is recommended
- **View Medication Details**: User can select a medication to navigate to Medication Details Page

---

#### 3.2.7 Medication Details Page

**Purpose**: Provide expanded information on specific medications.

**Key Functions**:

- Display detailed medication information
- Show usage instructions and precautions

---

#### 3.2.8 My Appointments Page

**Purpose**: Allow logged-in users to view and manage their booked dermatologist appointments.

**Key Functions**:

- **Display Appointments List**: Show all appointments for the logged-in user with the following information:
  - Appointment date and time
  - Dermatologist name
  - Status (pending_payment, confirmed, cancelled, completed)
  - Consultation fee in Naira
- **Cancel Appointment**: User can cancel appointments with pending_payment status
- **Reschedule Appointment**: User can reschedule appointments with confirmed status by clicking a Reschedule button
- **Reschedule Dialog**: When user clicks Reschedule button, display a dialog allowing user to select a new date and time slot for the same dermatologist
- **View Appointment Details**: User can view full details of each appointment
- **Status Change Notification Banner**: Display an in-app toast or banner notification when an appointment status has recently changed to confirmed or cancelled

---

#### 3.2.9 Profile Page

**Purpose**: Allow logged-in users to view and manage their account information and access chat history.

**Key Functions**:

- **Display User Information**: Show user's display name, email, and profile avatar
- **Edit Display Name**: User can update their display name
- **Edit Email**: User can update their email address
- **Edit Profile Avatar**: User can upload or change their profile avatar using the image-upload skill
- **Account Creation Date**: Display the date when the user account was created
- **Sign Out Button**: User can sign out of the application
- **Language Selector**: User can switch the application language between English, Yoruba, Igbo, Hausa, and Nigerian Pidgin
- **Chat History Section**: Display list of past AI dermatologist chat conversations with the following information:
  - Conversation date and time
  - Associated scan result (if applicable)
  - Preview of first message or conversation topic
  - Continue button for each conversation
- **View Chat Conversation**: User can select a conversation to view full message history
- **Resume Chat Conversation**: User can click the Continue button on any past conversation to navigate to DermatologistChatPage with the full prior message history pre-loaded

---

## 4. Business Rules and Logic

### 4.1 AI Analysis Integration

- The application uses the large-language-model skill to analyze uploaded skin condition images and optional text descriptions
- Analysis results are generated based on image input and text description (if provided) and return structured data including condition name, severity, confidence score, treatment recommendations, and medication suggestions

### 4.2 Image Upload Integration

- The application uses the image-upload skill to handle photo uploads from user devices
- The image-upload skill is also used for uploading and updating profile avatars

### 4.3 Text Description Processing

- Text description is optional and sent along with the image to the AI for enhanced analysis context
- Text description may include symptoms, duration, pain level, and other relevant details

### 4.4 Processing Status Display

- Processing overlay displays sequential status steps to inform users of progress
- Status steps include: uploading image, analyzing with AI, and generating recommendations

### 4.5 Medication Recommendation Logic

- Medication recommendations are specific to the Nigerian pharmaceutical market
- Pricing information is displayed as categorical price levels: low, medium, or high
- Price levels are represented using visual indicators such as Naira signs or color-coded badges
- Each medication includes an effectiveness rating to help users make informed decisions

### 4.6 Severity Classification

- Severity levels are categorized as: mild, moderate, or severe
- Severity level influences treatment and medication recommendations

### 4.7 Confidence Score Interpretation

- Confidence score represents the AI model's certainty in the prediction
- Higher confidence scores indicate more reliable predictions
- Users are advised to seek professional consultation if confidence scores are low or severity is high

### 4.8 User Account Management

- User registration and login are required to access the application
- System stores user account information for authentication purposes
- Users can update their display name, email, and profile avatar from the Profile Page
- System records account creation date for each user

### 4.9 Multi-language Support

- The application supports five languages: English, Yoruba, Igbo, Hausa, and Nigerian Pidgin
- Users can switch language from the Header and Profile Page
- Language selection applies to all UI text including navigation, buttons, labels, page headings, form fields, error messages, and content throughout the application
- User's language preference is stored and persists across sessions

### 4.10 Chat Conversation Storage

- AI dermatologist chat conversations are saved to the Supabase database
- Each conversation is linked to the logged-in user via user_id
- Conversations can optionally be linked to a specific scan result
- Users can access and review past chat sessions from the Profile Page
- Full message history is preserved for each conversation session

### 4.11 Appointment Management

- Appointments are stored in the Supabase appointments table with fields: id, user_id, dermatologist_id, order_id, appointment_date, appointment_time, status, payment_provider, notes, created_at
- Appointment status values include: pending_payment, confirmed, cancelled, completed
- Users can only cancel appointments with pending_payment status
- Users can reschedule appointments with confirmed status
- Dermatologist information is retrieved from the dermatologists table including name, photo_url, specialization, location, and consultation_fee_naira
- Order status is tracked in the orders table

### 4.12 Appointment Status Change Notifications

- When an appointment status changes to confirmed or cancelled, the system sends an email notification to the user via Supabase Auth email or Edge Function
- The system also displays an in-app toast or banner notification on the My Appointments page when the appointment status has recently changed
- Email notifications include appointment details such as date, time, dermatologist name, and new status

### 4.13 Reschedule Appointment Logic

- Only appointments with confirmed status can be rescheduled
- When user clicks the Reschedule button, a dialog opens displaying available date and time slots for the same dermatologist
- User selects a new date and time slot
- System updates the appointment_date and appointment_time fields in the appointments table
- The dermatologist_id remains unchanged during rescheduling

### 4.14 Resume Chat Conversation Logic

- Each past conversation in the Chat History section displays a Continue button
- When user clicks the Continue button, the system navigates to DermatologistChatPage at /dermatologist-chat
- The full prior message history is passed via React Router location.state and pre-loaded in the chat interface
- User can continue the conversation from where it left off

### 4.15 Floating Chatbot FAB Logic

- The floating action button is persistently displayed in the bottom-right corner of the Home Page
- When user clicks the FAB, the system navigates to DermatologistChatPage at /dermatologist-chat
- A new chat session is initiated without requiring a prior scan
- The FAB provides quick access to the AI dermatologist chatbot for general skin-related questions

---

## 5. Exceptions and Boundary Conditions

| Scenario | Handling Approach |
|----------|-------------------|
| User uploads an image that is not a skin condition photo | Display error message indicating the image cannot be analyzed and prompt user to upload a valid skin photo |
| AI analysis fails or returns no results | Display error message and allow user to retry with a different image |
| Low confidence score (below threshold) | Display warning message advising user to consult a medical professional for accurate diagnosis |
| Severe condition detected | Emphasize the need for immediate professional medical consultation |
| No medication recommendations available for detected condition | Display message indicating no specific medications are recommended and suggest consulting a healthcare provider |
| Image upload fails due to network issues | Display error message and provide option to retry upload |
| Processing overlay timeout | Display error message and allow user to retry submission |
| User attempts to access application without logging in | Redirect user to Login Page |
| Registration with existing email | Display error message indicating email is already registered |
| Login with incorrect credentials | Display error message indicating invalid email or password |
| User updates email to an already registered email | Display error message indicating email is already in use |
| Profile avatar upload fails | Display error message and allow user to retry upload |
| User switches language | All UI text updates immediately to reflect the selected language |
| User has no chat history | Display message indicating no past conversations are available |
| Chat conversation fails to load | Display error message and provide option to retry |
| User has no appointments | Display message indicating no appointments have been booked |
| User attempts to cancel appointment with non-pending_payment status | Display error message indicating only pending appointments can be cancelled |
| Appointment cancellation fails | Display error message and allow user to retry |
| Appointments fail to load | Display error message and provide option to retry |
| Email notification fails to send | Log error and continue with in-app notification |
| User attempts to reschedule appointment with non-confirmed status | Display error message indicating only confirmed appointments can be rescheduled |
| No available time slots for rescheduling | Display message indicating no available slots and suggest contacting support |
| Reschedule operation fails | Display error message and allow user to retry |
| Resume chat fails to load message history | Display error message and allow user to retry |
| Floating chatbot FAB is clicked while offline | Display error message indicating network connection is required |

---

## 6. Acceptance Criteria

1. User completes registration and logs in to the application
2. User navigates to the Home Page and sees four action cards: Scan, Upload, History, and About, plus a floating chatbot FAB in the bottom-right corner
3. User clicks the Upload card and is directed to the Photo Input Page
4. User uploads an existing image of the affected skin area using the image-upload skill
5. User optionally enters text description of skin condition symptoms, duration, and pain level
6. User submits the image and optional text description for analysis
7. System displays full-screen processing overlay with animated loading indicators and visual status steps
8. System processes the image and text description using the large-language-model skill and displays the Analysis Results Page with predicted skin condition name, severity level, confidence score, treatment recommendations, and medication recommendations with categorical price levels (low, medium, or high) displayed as visual indicators and effectiveness ratings
9. User reviews the analysis results and decides on next steps based on the provided recommendations
10. User has an AI dermatologist chat conversation and the conversation is saved to the Supabase database linked to the user
11. User navigates to the Profile Page from the Header
12. User views their display name, email, profile avatar, account creation date, and Chat History Section
13. User selects a past chat conversation from the Chat History Section and views the full message history
14. User clicks the Continue button on a past conversation and is navigated to DermatologistChatPage with the full prior message history pre-loaded
15. User navigates to the My Appointments Page
16. User views all their booked appointments showing appointment date, time, dermatologist name, status, and consultation fee in Naira
17. User cancels an appointment with pending_payment status successfully
18. User clicks the Reschedule button on a confirmed appointment, selects a new date and time slot in the dialog, and the appointment is updated successfully
19. System sends an email notification and displays an in-app banner when an appointment status changes to confirmed or cancelled
20. User updates their display name and email successfully
21. User uploads a new profile avatar using the image-upload skill
22. User switches the application language from English to Yoruba and observes all UI text updates to Yoruba
23. User clicks the floating chatbot FAB on the Home Page and is navigated to DermatologistChatPage to start a new chat session
24. User signs out from the Profile Page

---

## 7. Features Not Included in This Release

- Detailed medication side effects and contraindications
- Community forum or user reviews for medications
- Export or share analysis results via email or social media
- Offline mode for image analysis
- Direct messaging with dermatologists
- Payment processing within the application