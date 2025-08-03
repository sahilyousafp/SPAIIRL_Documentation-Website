// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active nav link
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Login modal functionality
    loginBtn.addEventListener('click', function() {
        loginModal.style.display = 'block';
    });

    closeModal.addEventListener('click', function() {
        loginModal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simulate login process
        if (username && password) {
            alert('Login functionality would be implemented here. For demo purposes, this shows successful login.');
            loginModal.style.display = 'none';
            loginBtn.innerHTML = '<i class="fas fa-user-check"></i> Welcome, ' + username;
            loginBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
    });

    // Initialize calendar
    initializeCalendar();
    
    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
});

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

// Add smooth hover effects
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.tool-card, .resource-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

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

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);

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

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', enhanceAccessibility);
