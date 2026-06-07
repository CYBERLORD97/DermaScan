const en = {
  // Nav
  nav: {
    home: 'Home',
    scan: 'Scan',
    history: 'Scan History',
    chat_history: 'Chat History',
    about: 'About',
    profile: 'Profile',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
  },

  // Common
  common: {
    back_home: 'Back to Home',
    back_results: 'Back to Results',
    start_scan: 'Start a Scan',
    analyze_another: 'Analyze Another Photo',
    no_result: 'No analysis result found.',
    new_scan: 'Start New Scan',
    medical_disclaimer: 'Medical Disclaimer',
    disclaimer_text:
      'DermaScan is an informational tool and is not a substitute for professional medical diagnosis or treatment. Always consult a qualified dermatologist or healthcare provider before starting any medication or treatment.',
    not_substitute: 'Not a substitute for professional medical advice. Always consult a dermatologist.',
    saving: 'Saving…',
    save: 'Save Changes',
    cancel: 'Cancel',
    loading: 'Loading…',
  },

  // Home
  home: {
    hero_title: 'DermaScan',
    hero_subtitle: 'Snap a photo or describe your skin — get AI-powered condition analysis instantly.',
    start_scan: 'Start Skin Scan',
    new_scan: 'New Scan',
    new_scan_sub: 'Photo or text',
    history: 'History',
    history_sub: 'Past analyses',
    book_appointment: 'Book Appointment',
    book_appointment_sub: 'Consult a dermatologist directly',
    why_title: 'Why DermaScan?',
    feature_instant: 'Instant Analysis',
    feature_instant_desc: 'AI-powered results in seconds from any photo.',
    feature_trusted: 'Trusted Accuracy',
    feature_trusted_desc: 'Trained on dermatology datasets for reliable detection.',
    feature_nigerian: 'Nigerian Market',
    feature_nigerian_desc: 'Medication prices and availability for Nigerian pharmacies.',
    cta_title: 'Get full access',
    cta_sub: 'Sign in to save your scan history',
    sign_up: 'Sign Up',
  },

  // Login
  login: {
    welcome: 'Welcome Back',
    subtitle: 'Sign in to your DermaScan account',
    email: 'Email',
    email_placeholder: 'Enter your email address',
    password: 'Password',
    password_placeholder: 'Enter your password',
    submit: 'Sign In',
    no_account: "Don't have an account?",
    register_link: 'Register',
    error_fields: 'Please enter your email and password',
    error_invalid: 'Invalid email or password',
    success: 'Login successful',
  },

  // Register
  register: {
    title: 'Create Account',
    subtitle: 'Join DermaScan to start analyzing your skin',
    full_name: 'Full Name',
    full_name_placeholder: 'Enter your full name',
    email: 'Email',
    email_placeholder: 'Enter your email address',
    password: 'Password',
    password_placeholder: 'Create a password',
    confirm_password: 'Confirm Password',
    confirm_placeholder: 'Confirm your password',
    terms_prefix: 'I agree to the',
    terms_agreement: 'User Agreement',
    terms_and: 'and',
    terms_privacy: 'Privacy Policy',
    submit: 'Create Account',
    have_account: 'Already have an account?',
    sign_in: 'Sign In',
    error_fields: 'Please fill in all fields',
    error_match: 'Passwords do not match',
    error_terms: 'You must agree to the terms',
    success: 'Account created successfully',
  },

  // Photo Input
  photo: {
    title: 'Skin Analysis',
    subtitle: 'Upload a photo or describe your symptoms',
    tab_photo: 'Photo',
    tab_describe: 'Describe',
    click_drag: 'Click or drag to upload',
    format_hint: 'JPEG, PNG, WEBP up to 5 MB',
    or: 'OR',
    open_camera: 'Take Photo',
    choose_gallery: 'Choose from Gallery',
    optional_label: 'Optional: describe your symptoms for better accuracy (any language)',
    optional_placeholder: 'e.g. Itchy red patch on forearm for 3 days — or write in Yoruba, Igbo, or Hausa…',
    describe_label: 'Describe your skin condition',
    describe_placeholder:
      'e.g. I have a round scaly patch on my left arm, slightly raised, itchy. It appeared about a week ago and is getting larger…',
    describe_hint:
      'You can write in English, Yoruba, Igbo, or Hausa. Include: location, appearance, duration, symptoms (itch/pain/burning), triggers if known.',
    analyze_photo: 'Analyze Photo',
    analyze_desc: 'Analyze Description',
    error_format: 'Unsupported format. Please use JPEG, PNG, WEBP, GIF, or AVIF.',
    error_size: 'File too large. Maximum size is 5 MB.',
    error_empty: 'Please upload a photo or describe your condition.',
    error_analysis: 'Analysis failed. Please try again.',
    error_rate_limit: 'Too many requests. Please wait a moment and try again.',
  },

  // Processing overlay
  processing: {
    uploading: 'Uploading image…',
    analyzing: 'Analyzing with AI…',
    generating: 'Generating recommendations…',
    preparing: 'Preparing your analysis…',
    step_upload: 'Uploading photo',
    step_analyze: 'Analyzing with AI',
    step_recommend: 'Generating recommendations',
    step_reading: 'Reading your description',
    step_identify: 'Identifying condition',
    step_almost: 'Almost there…',
    footer_image: 'This may take up to 30 seconds',
    footer_text: 'Analyzing your description…',
  },

  // Analysis Results
  results: {
    label: 'Analysis Result',
    severity_suffix: 'Severity',
    low_confidence: 'Low Confidence',
    confidence_label: 'AI Confidence Score',
    important_notice: 'Important Notice',
    next_steps: 'Next Steps',
    treatment_title: 'Treatment Recommendations',
    medication_title: 'Medication Recommendations',
    ai_disclaimer: 'This analysis is AI-generated and not a substitute for professional medical advice.',
    highly_effective: 'Highly Effective',
    effective: 'Effective',
    less_effective: 'Less Effective',
    cheap: 'Cheap',
    affordable: 'Affordable',
    expensive: 'Expensive',
  },

  // Audio diagnosis
  audio: {
    title: 'Listen to Diagnosis',
    listen: 'Listen',
    generating: 'Generating…',
    regenerate: 'Regenerate',
    restart: 'Restart',
    playing_in: 'Playing in',
    error_generate: 'Failed to generate audio. Please try again.',
  },

  // Medication Details
  medication: {
    label: 'Medication',
    effectiveness: 'Effectiveness',
    price_nigeria: 'Price (Nigeria)',
    description: 'Description',
    no_medication: 'No medication selected.',
    disclaimer_body:
      'Always consult a qualified healthcare professional before starting any medication. Prices are approximate for the Nigerian pharmaceutical market and may vary.',
  },

  // History
  history: {
    title: 'Analysis History',
    empty: 'No analysis history yet.',
    first_scan: 'Start Your First Scan',
    unknown: 'Unknown Condition',
    low_badge: 'Low',
    failed: 'Failed to load history',
  },

  // About
  about: {
    title: 'About DermaScan',
    how_title: 'How It Works',
    how_content:
      'DermaScan uses a multimodal large language model to analyze photos of skin conditions. Simply upload or capture a clear photo of the affected area, and our AI will identify the most likely condition, assess severity, and suggest treatment steps and medications available in the Nigerian pharmaceutical market.',
    price_title: 'Medication Prices',
    price_content:
      'All medication prices are shown in Nigerian Naira (₦) and represent approximate ranges based on typical pharmacy pricing in Nigeria. Prices may vary by location, pharmacy, brand, and availability. Always verify current prices with your local pharmacist.',
    privacy_title: 'Privacy',
    privacy_content:
      'Your uploaded photos are stored securely in encrypted cloud storage and are only accessible to your account. We do not share your images or analysis results with third parties. You can request deletion of your data at any time.',
    disclaimer_body:
      'DermaScan is an informational tool and is not a substitute for professional medical diagnosis or treatment. The AI-generated results are estimates and may be incorrect. Always consult a qualified dermatologist or healthcare provider before starting any medication or treatment. If you experience severe symptoms, seek medical attention immediately.',
    copyright: 'DermaScan. Built for the Nigerian market.',
  },

  // Profile
  profile: {
    title: 'My Profile',
    subtitle: 'Manage your account and preferences',
    display_name: 'Display Name',
    display_name_placeholder: 'Enter your display name',
    email: 'Email',
    email_placeholder: 'Enter your email',
    member_since: 'Member Since',
    language: 'App Language',
    change_avatar: 'Change Avatar',
    save: 'Save Changes',
    sign_out: 'Sign Out',
    success: 'Profile updated successfully',
    error: 'Failed to update profile',
    section_account: 'Account Info',
    section_preferences: 'Preferences',
  },

  // Language names
  language: {
    en: 'English',
    yo: 'Yoruba',
    ig: 'Igbo',
    ha: 'Hausa',
    pcm: 'Pidgin',
  },

  // Chat & Dermatologist
  chat: {
    title: 'Chat with AI',
    subtitle: 'Ask questions about your condition and get expert insights',
    placeholder: 'Ask about your condition…',
    send: 'Send',
    thinking: 'AI is thinking…',
    connect_derm: 'Connect to Real Dermatologist',
    book_appointment: 'Book Appointment',
    error: 'Failed to send message. Please try again.',
    disclaimer: 'This is an AI chatbot and does not replace a real doctor.',
    empty_prompt: 'Please type a message first',
    welcome_context: 'Hello {{name}}, I have context about your scan. What would you like to know about your condition?',
    welcome_general: 'Hello {{name}}, how may I assist you today?',
  },

  // Dermatologist Booking
  booking: {
    title: 'Book an Appointment',
    subtitle: 'Choose a dermatologist and select your preferred time',
    select_derm: 'Choose Dermatologist',
    select_date: 'Select Date',
    select_time: 'Select Time',
    consultation_fee: 'Consultation Fee',
    book_now: 'Book & Pay Now',
    processing: 'Processing payment…',
    success_title: 'Appointment Booked!',
    success_body: 'Your appointment has been confirmed. A confirmation will be sent to your email.',
    cancel: 'Cancel',
    back: 'Back',
    available: 'Available',
    unavailable: 'Unavailable',
    experience: 'Experience',
    specialization: 'Specialization',
    error_select: 'Please select a date and time slot',
    pay_stripe: 'Pay with Card (Stripe)',
    pay_paystack: 'Pay with Paystack',
    years: 'years',
  },

  // Payment
  payment: {
    success_title: 'Payment Successful!',
    success_body: 'Your appointment is confirmed. Check your email for details.',
    failed_title: 'Payment Failed',
    failed_body: 'Your payment could not be processed. Please try again.',
    verifying: 'Verifying payment…',
    view_appointments: 'View My Appointments',
    new_scan: 'Start New Scan',
  },

  // My Appointments
  appointments: {
    title: 'My Appointments',
    subtitle: 'View and manage your dermatologist appointments',
    empty: 'You have no appointments yet.',
    empty_desc: 'Book a consultation with a dermatologist.',
    book_now: 'Book an Appointment',
    status_pending_payment: 'Pending Payment',
    status_confirmed: 'Confirmed',
    status_cancelled: 'Cancelled',
    status_completed: 'Completed',
    cancel_btn: 'Cancel',
    cancel_confirm: 'Are you sure you want to cancel this appointment?',
    cancel_success: 'Appointment cancelled.',
    cancel_error: 'Could not cancel appointment. Please try again.',
    load_error: 'Failed to load appointments.',
    date_label: 'Date',
    time_label: 'Time',
    fee_label: 'Fee',
    derm_label: 'Dermatologist',
    reschedule_btn: 'Reschedule',
    reschedule_title: 'Reschedule Appointment',
    reschedule_desc: 'Select a new date and time for your appointment.',
    reschedule_success: 'Appointment rescheduled successfully.',
    reschedule_error: 'Failed to reschedule appointment.',
    notification_title: 'Appointment Update',
    notification_desc: 'Your appointment status has changed to {{status}}.',
  },

  // Chat History
  chat_history: {
    title: 'Chat History',
    subtitle: 'Your past AI dermatologist conversations',
    empty: 'No past conversations yet.',
    empty_desc: 'Ask questions about your skin condition and get expert advice from our AI.',
    start_chat: 'Start a Chat',
    view_thread: 'View',
    continue: 'Continue',
    continue_chat: 'Continue',
    thread_title: 'Conversation',
    back: 'Back to Profile',
    messages_label: 'messages',
    condition_label: 'Condition',
    delete_session: 'Delete',
    delete_confirm: 'Delete this conversation?',
    deleted: 'Chat session deleted',
    delete_error: 'Failed to delete session',
    delete_success: 'Conversation deleted.',
  },
};

export default en;
