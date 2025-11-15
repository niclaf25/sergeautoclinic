/*
 * Main JavaScript file for Serge Auto Clinic Website
 * Handles:
 * 1. Page load-in animation.
 * 2. Revealing content sections on scroll.
 * 3. Smooth-scrolling for navigation links.
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Page Load-in animation
  const loader = document.getElementById('loader');
  
  // On window load, trigger the animation and then hide the loader
  window.addEventListener('load', () => {
    // Add the class to the body to trigger the animations
    document.body.classList.add('page-loaded');

    // Hide the loader screen after a short delay to let animations start
    setTimeout(() => {
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 100);
  });
  
  // As a fallback, if the load event fails or takes too long, 
  // still run the animation and hide the loader.
  setTimeout(() => {
    document.body.classList.add('page-loaded');
    if (loader) {
        loader.classList.add('hidden');
    }
  }, 2000);


  // 2. Reveal on scroll functionality
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: '0px',
    threshold: 0.1 // 10% of the element must be visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Optional: stop observing the element once it's visible
        observer.unobserve(entry.target); 
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    observer.observe(el);
  });
  
  // 3. Navigation smooth-scrolling
  const smoothScroll = (selector, targetId) => {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  };

  smoothScroll('#mainTitle', 'about');
  smoothScroll('.nav-brand', 'hero');
  smoothScroll('.block-contact', 'contact');
  smoothScroll('.block-services', 'services');
  smoothScroll('.block-about', 'about');

  // 4. Transform diagonal blocks into sticky navigation after hero
  const diagonalBlocks = document.querySelector('.diagonal-blocks');
  const navSentinel = document.querySelector('.nav-sentinel');

  if (diagonalBlocks && navSentinel) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            diagonalBlocks.classList.remove('is-sticky');
          } else {
            diagonalBlocks.classList.add('is-sticky');
          }
        });
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '-10% 0px 0px 0px',
      }
    );

    navObserver.observe(navSentinel);
  }

  // 5. Interactive card hover effects - subtle glow tracking (desktop only)
  // Check if device supports hover (not a touch device)
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  
  if (supportsHover) {
    const glassCards = document.querySelectorAll('.card-glass');
    
    glassCards.forEach(card => {
      let rafId = null;
      
      card.addEventListener('mousemove', (e) => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Calculate glow position (0-100%)
          const glowX = (x / rect.width) * 100;
          const glowY = (y / rect.height) * 100;
          
          // Only update glow position, no 3D transforms
          card.style.setProperty('--mouse-x', `${glowX}%`);
          card.style.setProperty('--mouse-y', `${glowY}%`);
        });
      });
      
      card.addEventListener('mouseleave', () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      });
    });
  }

  // 6. Live hours status indicator
  const hoursStatusEl = document.querySelector('.hours-status');
  const hoursStatusLabel = hoursStatusEl?.querySelector('.hours-status-label');
  const hoursStatusMeta = hoursStatusEl?.querySelector('.hours-status-meta');
  const hoursItems = Array.from(document.querySelectorAll('.hours-list li[data-day-index]'));

  if (hoursStatusEl && hoursStatusLabel && hoursStatusMeta && hoursItems.length) {
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const dayFormatter = new Intl.DateTimeFormat('en-CA', {
      weekday: 'long',
    });

    const schedule = hoursItems.map((item) => ({
      element: item,
      dayIndex: Number(item.dataset.dayIndex),
      closed: item.dataset.closed === 'true',
      open: item.dataset.open || null,
      close: item.dataset.close || null,
    }));

    const updateHoursStatus = () => {
      const now = new Date();
      const todayIndex = now.getDay();

      schedule.forEach((entry) => {
        entry.element.classList.toggle('is-today', entry.dayIndex === todayIndex);
        if (entry.dayIndex !== todayIndex) {
          entry.element.classList.remove('is-open-now');
        }
      });

      const getDateFor = (entry, key, fromDate = now) => {
        const time = entry[key];
        if (!time) return null;
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date(fromDate);
        let delta = entry.dayIndex - todayIndex;
        if (delta < 0) delta += 7;
        date.setDate(date.getDate() + delta);
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      const todayEntry = schedule.find((entry) => entry.dayIndex === todayIndex);
      let isOpen = false;
      let closingDate = null;
      let nextOpenDate = null;

      if (todayEntry && !todayEntry.closed && todayEntry.open && todayEntry.close) {
        const openDate = getDateFor(todayEntry, 'open');
        const closeDate = getDateFor(todayEntry, 'close');

        if (closeDate && openDate && closeDate <= openDate) {
          closeDate.setDate(closeDate.getDate() + 1);
        }

        if (openDate && closeDate && now >= openDate && now < closeDate) {
          isOpen = true;
          closingDate = closeDate;
        } else if (openDate && now < openDate) {
          nextOpenDate = openDate;
        }
      }

      if (!isOpen) {
        if (!nextOpenDate) {
          for (let offset = 1; offset <= 7; offset += 1) {
            const targetIndex = (todayIndex + offset) % 7;
            const nextEntry = schedule.find(
              (entry) => entry.dayIndex === targetIndex && !entry.closed && entry.open && entry.close,
            );

            if (nextEntry) {
              const openDate = getDateFor(nextEntry, 'open');
              if (openDate && openDate <= now) {
                openDate.setDate(openDate.getDate() + 7);
              }
              nextOpenDate = openDate;
              break;
            }
          }
        }

        hoursStatusEl.classList.remove('is-open');
        hoursStatusEl.classList.add('is-closed');
        hoursStatusLabel.textContent = 'Closed';

        if (todayEntry) {
          todayEntry.element.classList.remove('is-open-now');
        }

        if (nextOpenDate) {
          const nextDayIndex = nextOpenDate.getDay();
          let dayPhrase;

          if (nextDayIndex === todayIndex) {
            dayPhrase = 'today';
          } else if (nextDayIndex === ((todayIndex + 1) % 7)) {
            dayPhrase = 'tomorrow';
          } else {
            dayPhrase = dayFormatter.format(nextOpenDate);
          }

          hoursStatusMeta.textContent = `Opens ${dayPhrase} at ${timeFormatter.format(nextOpenDate)}`;
        } else {
          hoursStatusMeta.textContent = 'Closed for the week';
        }
      } else {
        hoursStatusEl.classList.add('is-open');
        hoursStatusEl.classList.remove('is-closed');
        hoursStatusLabel.textContent = 'Open';
        hoursStatusMeta.textContent = closingDate ? `Closes at ${timeFormatter.format(closingDate)}` : '';

        if (todayEntry) {
          todayEntry.element.classList.add('is-open-now');
        }
      }

      let nextChange = 30 * 1000;

      const candidateDates = [];
      if (closingDate) candidateDates.push(closingDate);
      if (nextOpenDate) candidateDates.push(nextOpenDate);

      if (candidateDates.length === 0) {
        for (let offset = 0; offset < 7; offset += 1) {
          const targetIndex = (todayIndex + offset) % 7;
          const entry = schedule.find((e) => e.dayIndex === targetIndex && !e.closed && e.open);
          if (entry) {
            const date = getDateFor(entry, 'open', now);
            if (date) {
              if (date <= now) date.setDate(date.getDate() + 7);
              candidateDates.push(date);
              break;
            }
          }
        }
      }

      if (candidateDates.length > 0) {
        const soonest = candidateDates.reduce((min, date) => (date < min ? date : min));
        const diff = soonest.getTime() - now.getTime();
        if (diff > 0) {
          nextChange = Math.min(diff + 500, nextChange);
        }
      }

      setTimeout(updateHoursStatus, nextChange);
    };

    updateHoursStatus();
  }

});
