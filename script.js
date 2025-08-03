// Google Drive API Configuration - Add your actual API keys here
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

// Configuration for SPAIIRL website
const SPAIIRL_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1example/edit';
const INTERVIEW_DOCS_URL = 'https://docs.google.com/document/d/1example/edit';

// Global Google API variables
let gapi_loaded = false;
let gsi_loaded = false;
let tokenClient;
let drive_files = [];
let filtered_files = [];
let isDriveConnected = false;

// Simple Authentication System
let currentUser = null;
let isSignedIn = false;

// Users database (in production, this would be server-side)
const usersDatabase = {
    "users": [
        {
            "id": 1,
            "username": "admin",
            "password": "spaiirl2025",
            "name": "SPAIIRL Admin",
            "email": "admin@spaiirl.com",
            "role": "admin"
        },
        {
            "id": 2,
            "username": "founder1",
            "password": "founder123",
            "name": "Founder One",
            "email": "founder1@spaiirl.com",
            "role": "founder"
        },
        {
            "id": 3,
            "username": "founder2",
            "password": "founder456",
            "name": "Founder Two",
            "email": "founder2@spaiirl.com",
            "role": "founder"
        },
        {
            "id": 4,
            "username": "researcher",
            "password": "research789",
            "name": "Research Team",
            "email": "research@spaiirl.com",
            "role": "researcher"
        }
    ]
};

// Chat responses database
const chatResponses = {
    greetings: [
        "Hello! I'm your SPAIIRL AI Assistant. How can I help you today?",
        "Hi there! Welcome to SPAIIRL. What would you like to know?",
        "Greetings! I'm here to assist you with SPAIIRL information."
    ],
    about: [
        "SPAIIRL is the Strategic Planning and AI Research Lab, a collaboration hub for founders and researchers working on AI initiatives.",
        "We're focused on strategic planning and cutting-edge AI research. Our platform helps teams collaborate effectively."
    ],
    tools: [
        "We have several collaboration tools available: Google Sheets for data analysis, Reference Questions for interviews, Google Slides for presentations, and Miro for visual collaboration.",
        "Our main tools include collaborative spreadsheets, interview preparation documents, presentation software, and visual brainstorming boards."
    ],
    help: [
        "I can help you with information about SPAIIRL, our tools, getting started, or answer any questions you have about our platform.",
        "Feel free to ask me about our collaboration tools, team members, projects, or how to get started with SPAIIRL."
    ],
    default: [
        "That's an interesting question! While I don't have specific information about that, I can help you with SPAIIRL-related topics.",
        "I'm still learning! Could you try asking about SPAIIRL, our tools, or how I can assist you?",
        "I might not have the perfect answer for that, but I'm here to help with SPAIIRL information and support."
    ]
};

// Authentication Functions
function authenticateUser(username, password) {
    const user = usersDatabase.users.find(u => 
        (u.username === username || u.email === username) && u.password === password
    );
    return user || null;
}

function signInUser(user) {
    currentUser = user;
    isSignedIn = true;
    
    // Store in localStorage
    localStorage.setItem('spaiirl_user', JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        signedInAt: new Date().toISOString()
    }));
    
    updateUIForSignedInUser();
}

function signOutUser() {
    currentUser = null;
    isSignedIn = false;
    localStorage.removeItem('spaiirl_user');
    updateUIForSignedOutUser();
}

function checkExistingAuth() {
    const storedUser = localStorage.getItem('spaiirl_user');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            const signedInAt = new Date(userData.signedInAt);
            const now = new Date();
            const hoursDiff = (now - signedInAt) / (1000 * 60 * 60);
            
            // Keep user signed in for 24 hours
            if (hoursDiff < 24) {
                currentUser = userData;
                isSignedIn = true;
                updateUIForSignedInUser();
            } else {
                localStorage.removeItem('spaiirl_user');
            }
        } catch (error) {
            localStorage.removeItem('spaiirl_user');
        }
    }
}

function updateUIForSignedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-user-check"></i> Welcome, ${currentUser.name.split(' ')[0]}`;
        loginBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        // Add click event for sign out
        loginBtn.onclick = function(e) {
            e.preventDefault();
            if (confirm('Do you want to sign out?')) {
                signOutUser();
            }
        };
    }
    
    // Close login modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
    
    // Enable drive access
    enableDriveAccess();
}

function updateUIForSignedOutUser() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> Sign In';
        loginBtn.style.background = 'linear-gradient(135deg, #7c3aed, #a855f7)';
        
        // Add click event for showing login modal
        loginBtn.onclick = function() {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'block';
            }
        };
    }
    
    // Disable drive access
    disableDriveAccess();
    isDriveConnected = false;
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    
    // Initialize Google Auth when the page loads - removed for simple authentication
    // No longer using Google OAuth
    
    // Check for existing authentication
    checkExistingAuth();
    
    // Initialize drive interface
    disableDriveAccess();
    
    // Chat input event listeners
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !chatInput.disabled) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (!sendButton.disabled) {
                sendChatMessage();
            }
        });
    }
    
    // Floating drive panel event listeners
    const floatingDriveBtn = document.querySelector('.floating-chat-btn');
    const floatingDriveWindow = document.querySelector('.floating-chat-window');
    const closeDriveBtn = document.getElementById('close-floating-chat');
    
    if (floatingDriveBtn) {
        floatingDriveBtn.addEventListener('click', toggleDrivePanel);
    }
    
    if (closeDriveBtn) {
        closeDriveBtn.addEventListener('click', closeDrivePanel);
    }
    
    // Initialize drive panel state
    disableDriveAccess();
    
    // Setup file search functionality
    setupFileSearch();
    
    // Initialize calendar
    renderCalendar();
    
    // Setup smooth scrolling for navigation links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add smooth hover effects to cards
    const cards = document.querySelectorAll('.tool-card, .resource-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Initialize other features
    if (typeof lazyLoadImages === 'function') {
        lazyLoadImages();
    }
    
    if (typeof enhanceAccessibility === 'function') {
        enhanceAccessibility();
    }
    
    // Send chat message function (removed - no longer needed for drive access)
    function sendChatMessage() {
        // Function removed - drive panel doesn't need chat functionality
    }
    
    // Hamburger menu functionality
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Login modal functionality
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            if (loginModal && !isSignedIn) {
                loginModal.style.display = 'block';
            }
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            if (loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            if (usernameInput && passwordInput) {
                const username = usernameInput.value.trim();
                const password = passwordInput.value.trim();
                
                if (!username || !password) {
                    alert('Please enter both username and password.');
                    return;
                }
                
                const user = authenticateUser(username, password);
                if (user) {
                    signInUser(user);
                    usernameInput.value = '';
                    passwordInput.value = '';
                } else {
                    alert('Invalid credentials. Please check the demo credentials shown above.');
                }
            }
        });
    }
});

// Utility functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Open specific SPAIIRL Google Sheet
function openSpecificSheet() {
    window.open(SPAIIRL_SHEET_URL, '_blank');
}

// Open specific Interview Questions Doc
function openSpecificDoc() {
    window.open(INTERVIEW_DOCS_URL, '_blank');
}

// Open Google Calendar
function openGoogleCalendar() {
    window.open('https://calendar.google.com/calendar/u/0/r', '_blank');
}

function openTool(tool) {
    const urls = {
        'slides': 'https://slides.google.com',
        'drive': 'https://drive.google.com',
        'meet': 'https://meet.google.com',
        'calendar': 'https://calendar.google.com',
        'miro': 'https://miro.com',
        'figma': 'https://figma.com'
    };
    
    if (urls[tool]) {
        window.open(urls[tool], '_blank');
    }
}

// Calendar functionality
function renderCalendar() {
    const year = current_calendar_date.getFullYear();
    const month = current_calendar_date.getMonth();
    
    // Update month display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Generate calendar days
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.color = '#7c3aed';
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Highlight today
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Add sample events (you can customize this)
        if (day % 7 === 0 || day % 11 === 0) {
            dayElement.classList.add('has-event');
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

function previousMonth() {
    current_calendar_date.setMonth(current_calendar_date.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    current_calendar_date.setMonth(current_calendar_date.getMonth() + 1);
    renderCalendar();
}

// Google Calendar Functions
function authorizeCalendar() {
    if (!user_signed_in) {
        showChatMessage('Please sign in first to access your Google Calendar.', 'bot');
        return;
    }
    
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        loadCalendarEvents();
    }
}

async function loadCalendarEvents() {
    try {
        updateCalendarStatus('Loading your calendar events...', 'loading');
        
        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': startOfMonth.toISOString(),
            'timeMax': endOfMonth.toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'orderBy': 'startTime'
        });
        
        calendar_events = response.result.items || [];
        
        updateCalendarStatus(`Found ${calendar_events.length} events this month`, 'success');
        displayCalendarEvents();
        showCalendarWidget();
        
    } catch (error) {
        console.error('Error loading calendar events:', error);
        updateCalendarStatus('Error loading calendar events', 'error');
    }
}

function updateCalendarStatus(message, type = 'ready') {
    const statusText = document.getElementById('calendar-status-text');
    const statusIcon = document.getElementById('calendar-status-icon');
    const authBtn = document.getElementById('calendar-auth-btn');
    
    if (statusText) {
        statusText.textContent = message;
    }
    
    if (statusIcon) {
        statusIcon.className = 'fas fa-calendar';
        switch(type) {
            case 'success':
                statusIcon.style.color = '#10b981';
                break;
            case 'loading':
                statusIcon.className = 'fas fa-spinner fa-spin';
                statusIcon.style.color = '#f59e0b';
                break;
            case 'error':
                statusIcon.style.color = '#ef4444';
                break;
            default:
                statusIcon.style.color = '#7c3aed';
        }
    }
    
    if (authBtn && type === 'success') {
        authBtn.style.display = 'none';
    }
}

function showCalendarWidget() {
    const widget = document.getElementById('google-calendar-widget');
    const staticCalendar = document.getElementById('static-calendar');
    
    if (widget) {
        widget.style.display = 'block';
    }
    if (staticCalendar) {
        staticCalendar.style.display = 'none';
    }
    
    updateCalendarControls();
}

function updateCalendarControls() {
    const monthYearElement = document.getElementById('calendar-month-year');
    if (monthYearElement) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const now = new Date();
        monthYearElement.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
}

function displayCalendarEvents() {
    const eventsList = document.getElementById('calendar-events-list');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    if (calendar_events.length === 0) {
        eventsList.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <p>No events found for this month</p>
            </div>
        `;
        return;
    }
    
    calendar_events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event';
        
        const startTime = event.start.dateTime || event.start.date;
        const endTime = event.end.dateTime || event.end.date;
        
        let timeString = '';
        if (event.start.dateTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            timeString = `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
        } else {
            timeString = `All day - ${new Date(startTime).toLocaleDateString()}`;
        }
        
        eventDiv.innerHTML = `
            <div class="event-title">${event.summary || 'No title'}</div>
            <div class="event-time">
                <i class="fas fa-clock"></i> ${timeString}
            </div>
            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
        `;
        
        eventsList.appendChild(eventDiv);
    });
}

function loadPreviousMonth() {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    loadCalendarEventsForMonth(prevMonth);
}

function loadNextMonth() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    loadCalendarEventsForMonth(nextMonth);
}

async function loadCalendarEventsForMonth(date) {
    try {
        updateCalendarStatus('Loading events...', 'loading');
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': startOfMonth.toISOString(),
            'timeMax': endOfMonth.toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'orderBy': 'startTime'
        });
        
        calendar_events = response.result.items || [];
        
        updateCalendarStatus(`Found ${calendar_events.length} events`, 'success');
        displayCalendarEvents();
        
        // Update month/year display
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthYearElement = document.getElementById('calendar-month-year');
        if (monthYearElement) {
            monthYearElement.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        }
        
    } catch (error) {
        console.error('Error loading calendar events:', error);
        updateCalendarStatus('Error loading events', 'error');
    }
}

function refreshCalendar() {
    loadCalendarEvents();
}

function openGoogleCalendar() {
    window.open('https://calendar.google.com', '_blank');
}

// Scroll to section function
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Update active navigation link based on scroll position
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

// Tool opening functions
function openTool(toolType) {
    let url = '';
    
    switch(toolType) {
        case 'sheets':
            url = 'https://docs.google.com/spreadsheets/';
            break;
        case 'docs':
            url = 'https://docs.google.com/document/';
            break;
        case 'slides':
            url = 'https://docs.google.com/presentation/';
            break;
        case 'miro':
            url = 'https://miro.com/';
            break;
        default:
            alert('Tool integration would be implemented here');
            return;
    }
    
    // Open in new tab
    window.open(url, '_blank');
}

// Google Calendar integration
function openGoogleCalendar() {
    window.open('https://calendar.google.com/', '_blank');
}

// Calendar functionality
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function initializeCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevButton = document.getElementById('prevMonth');
    const nextButton = document.getElementById('nextMonth');

    if (!calendarGrid || !currentMonthElement) return;

    function generateCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        currentMonthElement.textContent = `${months[month]} ${year}`;
        calendarGrid.innerHTML = '';

        // Add day headers
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day';
            dayHeader.style.background = '#7c3aed';
            dayHeader.style.color = 'white';
            dayHeader.style.fontWeight = '600';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Add empty cells for previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = daysInPrevMonth - i;
            calendarGrid.appendChild(dayElement);
        }

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            // Highlight today
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayElement.classList.add('today');
            }

            // Add sample events (you can replace this with real data)
            if (day % 7 === 0 || day % 11 === 0) {
                dayElement.classList.add('has-event');
                dayElement.title = 'Meeting scheduled';
            }

            dayElement.addEventListener('click', function() {
                alert(`Selected date: ${months[month]} ${day}, ${year}\nClick "Schedule Meeting" to add an event.`);
            });

            calendarGrid.appendChild(dayElement);
        }

        // Add empty cells for next month
        const totalCells = calendarGrid.children.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days = 42 cells
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        }
    }

    // Event listeners for navigation
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }

    // Generate initial calendar
    generateCalendar(currentMonth, currentYear);
}

// Intersection Observer for animations
function createObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.tool-card, .resource-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', createObserver);

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // ESC key to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('loginModal');
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }
});

// Add loading states for better UX
function showLoading(element) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.disabled = true;
    
    setTimeout(() => {
        element.innerHTML = originalContent;
        element.disabled = false;
    }, 2000);
}

// Enhanced tool opening with loading states
function openToolWithLoading(toolType) {
    const toolCards = document.querySelectorAll('.tool-card');
    const targetCard = Array.from(toolCards).find(card => 
        card.onclick.toString().includes(toolType)
    );
    
    if (targetCard) {
        const button = targetCard.querySelector('.tool-btn');
        showLoading(button);
    }
    
    setTimeout(() => {
        openTool(toolType);
    }, 1000);
}

// Error handling for external links
function handleExternalLinkError(url) {
    console.error('Failed to open external link:', url);
    alert('Unable to open external link. Please check your internet connection and try again.');
}

// Gemini Chatbot Functions
function enableGeminiChat() {
    const chatBtn = document.querySelector('.floating-chat-btn');
    const chatWindow = document.querySelector('.floating-chat-window');
    
    if (chatBtn) {
        chatBtn.style.display = 'flex';
        chatBtn.classList.remove('disabled');
    }
    
    // Enable chat input
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = `Hi ${currentUser.name.split(' ')[0]}! Ask me about your Drive files or anything else...`;
    }
    if (sendButton) {
        sendButton.disabled = false;
    }
}

function disableGeminiChat() {
    const chatBtn = document.querySelector('.floating-chat-btn');
    const chatWindow = document.querySelector('.floating-chat-window');
    
    if (chatBtn) {
        chatBtn.classList.add('disabled');
    }
    
    if (chatWindow) {
        chatWindow.classList.remove('open');
    }
    
    // Disable chat input
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const askFilesBtn = document.getElementById('ask-files-btn');
    const summarizeBtn = document.getElementById('summarize-btn');
    
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = 'Please sign in to chat with Gemini...';
    }
    if (sendButton) sendButton.disabled = true;
    if (askFilesBtn) askFilesBtn.disabled = true;
    if (summarizeBtn) summarizeBtn.disabled = true;
    
    // Reset drive status
    updateDriveStatus('Not connected to Drive', 'error');
    updateFileCount(0);
}

function toggleGeminiChat() {
    if (!isSignedIn) {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
        }
        return;
    }
    
    const chatWindow = document.querySelector('.floating-chat-window');
    if (chatWindow) {
        chatWindow.classList.toggle('open');
        
        if (chatWindow.classList.contains('open')) {
            const chatInput = document.getElementById('chat-input');
            if (chatInput && !chatInput.disabled) {
                setTimeout(() => chatInput.focus(), 300);
            }
        }
    }
}

function closeGeminiChat() {
    const chatWindow = document.querySelector('.floating-chat-window');
    if (chatWindow) {
        chatWindow.classList.remove('open');
    }
}

// Chat Message Functions
function addChatMessage(message, sender = 'user') {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    if (sender === 'bot') {
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
    } else {
        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(avatarDiv);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Process user message with Gemini
async function processChatMessage(message) {
    if (!message.trim()) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        let response;
        
        if (isDriveConnected && drive_files.length > 0) {
            // Use Gemini with Drive context
            response = await callGeminiWithDriveContext(message);
        } else {
            // Use Gemini without Drive context
            response = await callGeminiAPI(message);
        }
        
        removeTypingIndicator();
        addChatMessage(response, 'bot');
        
    } catch (error) {
        console.error('Error processing chat message:', error);
        removeTypingIndicator();
        addChatMessage('Sorry, I encountered an error. Please try again or connect to Google Drive for file-related questions.', 'bot');
    }
}

// Call Gemini API with Drive context
async function callGeminiWithDriveContext(userMessage) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        return generateFallbackResponse(userMessage);
    }
    
    // Prepare Drive context
    const driveContext = prepareDriveContext(userMessage);
    
    const prompt = `You are Gemini, an AI assistant helping with Google Drive files. The user has ${driveContext.totalFiles} files in their Drive.

User question: "${userMessage}"

Available files context:
${JSON.stringify(driveContext.files.slice(0, 10), null, 2)}

Instructions:
- Help the user with their Drive files when relevant
- If asking about specific files, search through the file list
- Provide file recommendations and summaries when appropriate
- Be conversational and helpful
- If the question isn't about files, answer normally

Please respond helpfully and mention specific files when relevant.`;
    
    return await callGeminiAPI(prompt);
}

// Call Gemini API
async function callGeminiAPI(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        return generateFallbackResponse(prompt);
    }
    
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
        
    } catch (error) {
        console.error('Gemini API error:', error);
        return generateFallbackResponse(prompt);
    }
}

// Generate fallback responses when Gemini isn't available
function generateFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (isDriveConnected) {
        if (message.includes('files') || message.includes('document') || message.includes('folder')) {
            return `I can see you have ${drive_files.length} files in your Google Drive. While I don't have access to the full Gemini API yet, I can help you navigate your files. Try using specific file names or asking about recent documents.`;
        }
    }
    
    if (message.includes('hello') || message.includes('hi')) {
        return `Hello! I'm Gemini, your AI assistant. I can help you with your Google Drive files once connected, answer questions, and assist with various tasks. How can I help you today?`;
    }
    
    if (message.includes('drive') || message.includes('connect')) {
        return `To access your Google Drive files, please click the "Connect Drive" button above. Once connected, I'll be able to help you find, organize, and work with your files.`;
    }
    
    return `I understand you're asking about "${userMessage}". While I don't have full Gemini API access configured yet, I'm here to help! You can connect your Google Drive to let me assist with your files, or ask me general questions.`;
}

// Quick action functions
function askAboutFiles() {
    if (!isDriveConnected) {
        addChatMessage('Please connect to Google Drive first so I can access your files.', 'bot');
        return;
    }
    
    processChatMessage('Tell me about my recent files and what types of documents I have');
}

function summarizeDrive() {
    if (!isDriveConnected) {
        addChatMessage('Please connect to Google Drive first so I can analyze your files.', 'bot');
        return;
    }
    
    processChatMessage('Give me a summary of my Google Drive contents and organization');
}
// Google Drive Connection Functions
async function connectToDrive() {
    if (!isSignedIn) {
        addChatMessage('Please sign in first to connect to Google Drive.', 'bot');
        return;
    }
    
    updateDriveStatus('Connecting to Google Drive...', 'loading');
    addChatMessage('Connecting to your Google Drive...', 'bot');
    
    try {
        // Initialize Google APIs
        if (!gapi_loaded) {
            await loadGoogleAPIs();
        }
        
        // Initialize Google Drive API
        await initializeDriveAPI();
        
        // Request access token
        await requestDriveAccess();
        
        // Load files
        await loadDriveFiles();
        
        // Enable chat features
        enableDriveFeatures();
        
        addChatMessage(`Great! I've connected to your Google Drive and found ${drive_files.length} files. Now I can help you find, organize, and work with your documents. What would you like to know about your files?`, 'bot');
        
    } catch (error) {
        console.error('Error connecting to Google Drive:', error);
        updateDriveStatus('Connection failed', 'error');
        addChatMessage('Sorry, I had trouble connecting to Google Drive. Please make sure you grant the necessary permissions and try again.', 'bot');
    }
}

function enableDriveFeatures() {
    const askFilesBtn = document.getElementById('ask-files-btn');
    const summarizeBtn = document.getElementById('summarize-btn');
    
    if (askFilesBtn) askFilesBtn.disabled = false;
    if (summarizeBtn) summarizeBtn.disabled = false;
}

function prepareDriveContext(userMessage) {
    // Filter relevant files based on the user's question
    const relevantFiles = drive_files.slice(0, 20); // Limit to prevent token overflow
    
    const fileList = relevantFiles.map(file => ({
        name: file.name,
        type: file.mimeType,
        modified: file.modifiedTime,
        size: file.size,
        id: file.id
    }));
    
    return {
        totalFiles: drive_files.length,
        files: fileList,
        query: userMessage
    };
}

async function loadGoogleAPIs() {
    return new Promise((resolve, reject) => {
        if (typeof gapi === 'undefined') {
            // Load Google API script
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client', () => {
                    gapi_loaded = true;
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        } else {
            gapi_loaded = true;
            resolve();
        }
    });
}

async function initializeDriveAPI() {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
}

async function requestDriveAccess() {
    return new Promise((resolve, reject) => {
        if (typeof google === 'undefined') {
            // Load Google Identity Services
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: SCOPES,
                    callback: (response) => {
                        if (response.error) {
                            reject(response.error);
                        } else {
                            resolve(response);
                        }
                    },
                });
                tokenClient.requestAccessToken();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        } else {
            if (!tokenClient) {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: SCOPES,
                    callback: (response) => {
                        if (response.error) {
                            reject(response.error);
                        } else {
                            resolve(response);
                        }
                    },
                });
            }
            tokenClient.requestAccessToken();
        }
    });
}

async function loadDriveFiles() {
    try {
        updateDriveStatus('Loading files...', 'loading');
        
        const response = await gapi.client.drive.files.list({
            pageSize: 100,
            fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, webViewLink)',
            q: "trashed=false"
        });
        
        drive_files = response.result.files || [];
        
        updateDriveStatus(`Connected (${drive_files.length} files)`, 'connected');
        
        isDriveConnected = true;
        
        console.log('Loaded', drive_files.length, 'files from Google Drive');
        
    } catch (error) {
        console.error('Error loading Drive files:', error);
        updateDriveStatus('Error loading files', 'error');
        throw error;
    }
}

function enableDriveControls() {
    // Enable quick action buttons
    const askFilesBtn = document.getElementById('ask-files-btn');
    const summarizeBtn = document.getElementById('summarize-btn');
    
    if (askFilesBtn) askFilesBtn.disabled = false;
    if (summarizeBtn) summarizeBtn.disabled = false;
}

function updateDriveStatus(message, type = 'info') {
    const statusText = document.getElementById('drive-status-text');
    const statusIndicator = document.getElementById('drive-status-indicator');
    
    if (statusText) statusText.textContent = message;
    
    if (statusIndicator) {
        statusIndicator.className = 'fas fa-circle';
        switch(type) {
            case 'connected':
            case 'success':
                statusIndicator.style.color = '#10b981';
                break;
            case 'loading':
                statusIndicator.style.color = '#f59e0b';
                statusIndicator.className = 'fas fa-spinner fa-spin';
                break;
            case 'error':
                statusIndicator.style.color = '#ef4444';
                break;
            default:
                statusIndicator.style.color = '#7c3aed';
        }
    }
}

// File utility functions (kept for Gemini context)
function getFileIcon(mimeType) {
    if (mimeType.includes('folder')) return 'fa-folder';
    if (mimeType.includes('document')) return 'fa-file-alt';
    if (mimeType.includes('spreadsheet')) return 'fa-table';
    if (mimeType.includes('presentation')) return 'fa-file-powerpoint';
    if (mimeType.includes('image')) return 'fa-image';
    if (mimeType.includes('video')) return 'fa-video';
    if (mimeType.includes('audio')) return 'fa-music';
    if (mimeType.includes('pdf')) return 'fa-file-pdf';
    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function openFile(url) {
    if (url) {
        window.open(url, '_blank');
    }
}

// Chat Message Functions
function addChatMessage(message, sender = 'user') {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    if (sender === 'bot') {
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
    } else {
        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(avatarDiv);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Generate AI Response
function generateAIResponse(userMessage) {
    const responses = {
        greetings: [
            `Hello ${currentUser.name.split(' ')[0]}! I'm your SPAIIRL AI assistant. How can I help you today?`,
            `Hi there! I'm here to help you with anything related to SPAIIRL. What would you like to know?`,
            `Welcome! I can help you navigate SPAIIRL resources, answer questions about our research, or assist with your projects.`
        ],
        about: [
            "SPAIIRL (Spatial AI Research Lab) focuses on spatial intelligence, computer vision, and AI research. We work on cutting-edge projects in autonomous systems, robotics, and spatial understanding.",
            "SPAIIRL is dedicated to advancing spatial artificial intelligence through innovative research in computer vision, robotics, and autonomous systems.",
            "Our lab specializes in spatial AI, developing solutions for navigation, object recognition, and environmental understanding."
        ],
        research: [
            "Our current research areas include autonomous navigation, 3D scene understanding, robot perception, and spatial mapping technologies.",
            "We're working on several exciting projects involving computer vision, machine learning for spatial data, and AI-powered robotics systems.",
            "SPAIIRL's research spans from fundamental spatial AI algorithms to practical applications in robotics and autonomous systems."
        ],
        projects: [
            "You can explore our current projects and research through the links in the main navigation. Each project page contains detailed information about our work.",
            "Our projects range from autonomous drone navigation to 3D reconstruction and spatial mapping. Check out the projects section for more details!",
            "We have several ongoing projects in spatial AI. Would you like me to help you find information about a specific area of research?"
        ],
        help: [
            "I can help you with information about SPAIIRL, our research projects, how to get involved, or navigate our resources. What specifically are you looking for?",
            "I'm here to assist with any questions about our lab, research opportunities, project details, or general information. How can I help?",
            "Feel free to ask me about SPAIIRL's research, ongoing projects, how to join our team, or any other questions you might have!"
        ],
        default: [
            "That's an interesting question! While I'm still learning about all aspects of SPAIIRL, I'd recommend checking our main website sections or reaching out to our team directly.",
            "I'm continuously learning about SPAIIRL's work. For detailed technical questions, you might want to explore our research papers or contact our research team.",
            "Thanks for your question! For the most up-to-date information, I'd suggest checking our project pages or reaching out to our team members directly."
        ]
    };
    
    const message = userMessage.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return getRandomResponse(responses.greetings);
    } else if (message.includes('about') || message.includes('what is') || message.includes('spaiirl')) {
        return getRandomResponse(responses.about);
    } else if (message.includes('research') || message.includes('study') || message.includes('work')) {
        return getRandomResponse(responses.research);
    } else if (message.includes('project') || message.includes('current') || message.includes('ongoing')) {
        return getRandomResponse(responses.projects);
    } else if (message.includes('help') || message.includes('assist') || message.includes('support')) {
        return getRandomResponse(responses.help);
    } else {
        return getRandomResponse(responses.default);
    }
}

function getRandomResponse(responseArray) {
    return responseArray[Math.floor(Math.random() * responseArray.length)];
}

// Process user message
async function processChatMessage(message) {
    if (!message.trim()) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate thinking time
    setTimeout(() => {
        removeTypingIndicator();
        const response = generateAIResponse(message);
        addChatMessage(response, 'bot');
    }, 1000 + Math.random() * 2000);
}

// Calendar Integration Functions
function loadCalendarEvents() {
    // This would integrate with Google Calendar API in a full implementation
    console.log('Calendar integration placeholder');
    
    // For demo purposes, we'll show a simple message
    const calendarSection = document.querySelector('.calendar-section');
    if (calendarSection) {
        calendarSection.innerHTML = `
            <h3><i class="fas fa-calendar-alt"></i> Upcoming Events</h3>
            <div class="calendar-events">
                <div class="event-item">
                    <div class="event-date">Dec 15</div>
                    <div class="event-details">
                        <div class="event-title">SPAIIRL Team Meeting</div>
                        <div class="event-time">2:00 PM - 3:00 PM</div>
                    </div>
                </div>
                <div class="event-item">
                    <div class="event-date">Dec 18</div>
                    <div class="event-details">
                        <div class="event-title">Research Presentation</div>
                        <div class="event-time">10:00 AM - 11:30 AM</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Quick Access Functions
function openQuickLink(type) {
    const links = {
        sheets: 'https://docs.google.com/spreadsheets/d/1example/edit',
        docs: 'https://docs.google.com/document/d/1example/edit',
        calendar: 'https://calendar.google.com/calendar/u/0/r',
        drive: 'https://drive.google.com/drive/my-drive'
    };
    
    if (links[type]) {
        window.open(links[type], '_blank');
    }
}

// Performance optimization: Lazy load images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Add accessibility improvements
function enhanceAccessibility() {
    // Add ARIA labels to interactive elements
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });

    // Add keyboard navigation for cards
    const cards = document.querySelectorAll('.tool-card, .resource-card');
    cards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}
