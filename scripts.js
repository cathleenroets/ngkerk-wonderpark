// Default images
const DEFAULT_PRAYER_IMAGE = 'https://images.unsplash.com/photo-1517486430290-6979eb1ebb64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
const DEFAULT_NEED_IMAGE = 'https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';

// LOCALSTORAGE HELPERS
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data || []));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function getFromLocalStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error getting from localStorage:', e);
    return [];
  }
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Hamburger Menu
const menuBtn = document.getElementById('menu-button');
const navLinks = document.getElementById('nav-links');
const overlay = document.getElementById('menu-overlay');

if (menuBtn && navLinks && overlay) {
  menuBtn.addEventListener('click', () => {
    const isActive = menuBtn.classList.toggle('is-active');
    navLinks.classList.toggle('open', isActive);
    overlay.classList.toggle('active', isActive);
    menuBtn.setAttribute('aria-expanded', isActive);
    navLinks.setAttribute('aria-hidden', !isActive);
  });

  overlay.addEventListener('click', () => {
    menuBtn.classList.remove('is-active');
    navLinks.classList.remove('open');
    overlay.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    navLinks.setAttribute('aria-hidden', 'true');
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && menuBtn.classList.contains('is-active')) {
      menuBtn.classList.remove('is-active');
      navLinks.classList.remove('open');
      overlay.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
      navLinks.setAttribute('aria-hidden', 'true');
    }
  });
}


// ANNOUNCEMENTS
function addAnnouncement() {
  const titleEl = document.getElementById('ann-title');
  const bodyEl = document.getElementById('ann-body');
  const imageEl = document.getElementById('ann-image');
  const submitBtn = document.querySelector('.announcement-form button');

  if (!titleEl || !bodyEl) return;

  const title = escapeHTML(titleEl.value.trim());
  const body = escapeHTML(bodyEl.value.trim());
  let image = imageEl ? imageEl.value.trim() : '';

  if (!title || !body) {
    alert('Please fill in the title and body.');
    return;
  }

  if (image && !/^https?:\/\/.+/.test(image)) {
    alert('Invalid image URL. It must start with http:// or https://.');
    return;
  }

  submitBtn.disabled = true;
  const announcements = getFromLocalStorage('announcements');
  announcements.push({ title, body, image, date: new Date().toISOString() });
  saveToLocalStorage('announcements', announcements);
  renderAnnouncements();

  titleEl.value = '';
  bodyEl.value = '';
  if (imageEl) imageEl.value = '';
  submitBtn.disabled = false;

  alert('Announcement posted successfully!');
}

function renderAnnouncements() {
  const list = document.getElementById('ann-list');
  if (!list) return;

  list.innerHTML = '';
  const announcements = getFromLocalStorage('announcements').sort((a, b) => new Date(b.date) - new Date(a.date));

  announcements.forEach(item => {
    const li = document.createElement('li');
    let content = `<strong>${item.title}</strong> (${new Date(item.date).toLocaleString()}): ${item.body}`;
    if (item.image) content += `<br><img src="${item.image}" alt="Announcement image" loading="lazy" style="max-width: 100%; height: auto;">`;
    li.innerHTML = content;
    list.appendChild(li);
  });
}

// PRAYERS
function submitPrayer() {
  const nameEl = document.getElementById('prayer-name');
  const msgEl = document.getElementById('prayer-msg');
  const imageEl = document.getElementById('prayer-image');
  const privateEl = document.getElementById('prayer-private');
  const submitBtn = document.querySelector('.prayer-form button');

  if (!msgEl) return;

  const name = escapeHTML((nameEl ? nameEl.value.trim() : '') || 'Anonymous');
  const msg = escapeHTML(msgEl.value.trim());
  let image = (imageEl ? imageEl.value.trim() : '') || DEFAULT_PRAYER_IMAGE;
  const isPrivate = privateEl ? privateEl.checked : false;

  if (!msg) {
    alert('Please describe your prayer request.');
    return;
  }

  if (image && image !== DEFAULT_PRAYER_IMAGE && !/^https?:\/\/.+/.test(image)) {
    alert('Invalid image URL.');
    return;
  }

  submitBtn.disabled = true;
  const prayers = getFromLocalStorage('prayers');
  prayers.push({ name, msg, image, private: isPrivate, date: new Date().toISOString() });
  saveToLocalStorage('prayers', prayers);
  renderPrayers();

  if (nameEl) nameEl.value = '';
  msgEl.value = '';
  if (imageEl) imageEl.value = '';
  if (privateEl) privateEl.checked = false;
  submitBtn.disabled = false;

  alert('Prayer request submitted successfully!');
}

function renderPrayers() {
  const list = document.getElementById('prayer-list');
  const featuredList = document.getElementById('prayer-featured-list');
  if (!list || !featuredList) return;

  list.innerHTML = '';
  featuredList.innerHTML = '';

  const prayers = getFromLocalStorage('prayers').sort((a, b) => new Date(b.date) - new Date(a.date));
  let featuredAdded = false;

  prayers.forEach((item, index) => {
    if (!item.private) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.name}</strong> (${new Date(item.date).toLocaleString()}): ${item.msg}`;
      if (item.image) {
        li.innerHTML += `<br><img src="${item.image}" alt="Prayer request image" loading="lazy" style="max-width: 100%; height: auto;">`;
      }

      ['facebook', 'instagram'].forEach(platform => {
        const btn = document.createElement('button');
        btn.className = `share-button ${platform}`;
        btn.innerHTML = `<i class="fab fa-${platform}"></i> Share`;
        btn.addEventListener('click', () => sharePrayer(index, platform));
        li.appendChild(btn);
      });

      if (!featuredAdded) {
        featuredList.appendChild(li.cloneNode(true));
        featuredAdded = true;
      } else {
        list.appendChild(li);
      }
    }
  });
}

// NEEDS & OFFERS
function submitNeed() {
  const typeEls = document.querySelectorAll('input[name="need-type"]');
  const nameEl = document.getElementById('need-name');
  const detailsEl = document.getElementById('need-details');
  const imageEl = document.getElementById('need-image');
  const submitBtn = document.querySelector('.needs-form button');

  if (!detailsEl) return;

  const type = Array.from(typeEls).find(el => el.checked)?.value;
  const name = escapeHTML((nameEl ? nameEl.value.trim() : '') || 'Anonymous');
  const details = escapeHTML(detailsEl.value.trim());
  let image = (imageEl ? imageEl.value.trim() : '') || DEFAULT_NEED_IMAGE;

  if (!type || !details) {
    alert('Please select a type and describe your need or offer.');
    return;
  }

  if (image && image !== DEFAULT_NEED_IMAGE && !/^https?:\/\/.+/.test(image)) {
    alert('Invalid image URL.');
    return;
  }

  submitBtn.disabled = true;
  const needs = getFromLocalStorage('needs');
  needs.push({ type, name, details, image, date: new Date().toISOString() });
  saveToLocalStorage('needs', needs);
  renderNeeds();

  if (nameEl) nameEl.value = '';
  detailsEl.value = '';
  if (imageEl) imageEl.value = '';
  typeEls[0].checked = true;
  submitBtn.disabled = false;

  alert('Your need or offer has been posted!');
}

function renderNeeds() {
  const list = document.getElementById('needs-list');
  const featuredList = document.getElementById('needs-featured-list');
  if (!list || !featuredList) return;

  list.innerHTML = '';
  featuredList.innerHTML = '';

  const needs = getFromLocalStorage('needs').sort((a, b) => new Date(b.date) - new Date(a.date));
  let featuredAdded = false;

  needs.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.type.toUpperCase()} - ${item.name}</strong> (${new Date(item.date).toLocaleString()}): ${item.details}`;
    if (item.image) {
      li.innerHTML += `<br><img src="${item.image}" alt="${item.type} image" loading="lazy" style="max-width: 100%; height: auto;">`;
    }

    ['facebook', 'instagram'].forEach(platform => {
      const btn = document.createElement('button');
      btn.className = `share-button ${platform}`;
      btn.innerHTML = `<i class="fab fa-${platform}"></i> Share`;
      btn.addEventListener('click', () => shareNeed(index, platform));
      li.appendChild(btn);
    });

    if (!featuredAdded) {
      featuredList.appendChild(li.cloneNode(true));
      featuredAdded = true;
    } else {
      list.appendChild(li);
    }
  });
}

// EVENTS
function addEvent() {
  const titleEl = document.getElementById('event-title');
  const dateEl = document.getElementById('event-date');
  const imageEl = document.getElementById('event-image');
  const linkEl = document.getElementById('event-link');
  const submitBtn = document.querySelector('.event-form button');

  if (!titleEl || !dateEl) return;

  const title = escapeHTML(titleEl.value.trim());
  const date = dateEl.value;
  let image = imageEl ? imageEl.value.trim() : '';
  let link = linkEl ? escapeHTML(linkEl.value.trim()) : '';

  if (!title || !date) {
    alert('Please fill in the title and date.');
    return;
  }

  if (image && !/^https?:\/\/.+/.test(image)) {
    alert('Invalid image URL.');
    return;
  }

  if (link && !/^https?:\/\/.+/.test(link)) {
    alert('Invalid event link URL.');
    return;
  }

  submitBtn.disabled = true;
  const events = getFromLocalStorage('events');
  events.push({ title, date, image, link });
  saveToLocalStorage('events', events);
  renderEvents();

  titleEl.value = '';
  dateEl.value = '';
  if (imageEl) imageEl.value = '';
  if (linkEl) linkEl.value = '';
  submitBtn.disabled = false;

  alert('Event added successfully!');
}

function renderEvents() {
  const list = document.getElementById('events-list');
  if (!list) return;

  list.innerHTML = '';
  const events = getFromLocalStorage('events').sort((a, b) => new Date(a.date) - new Date(b.date));

  events.forEach(item => {
    const li = document.createElement('li');
    let content = `<strong>${item.title}</strong> (${new Date(item.date).toLocaleString()})`;
    if (item.link) content += ` <a href="${item.link}" target="_blank" rel="noopener noreferrer">Details</a>`;
    if (item.image) content += `<br><img src="${item.image}" alt="Event image" loading="lazy" style="max-width: 100%; height: auto;">`;
    li.innerHTML = content;
    list.appendChild(li);
  });
}

// SHARE FUNCTIONS
function sharePrayer(index, platform) {
  const prayers = getFromLocalStorage('prayers');
  const prayer = prayers[index];
  if (!prayer) return;

  const text = encodeURIComponent(`${prayer.name}: ${prayer.msg}`);
  let url;
  if (platform === 'facebook') {
    url = `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${text}`;
  } else if (platform === 'instagram') {
    url = `https://www.instagram.com/?url=${window.location.href}&title=${text}`;
  }
  window.open(url, '_blank');
}

function shareNeed(index, platform) {
  const needs = getFromLocalStorage('needs');
  const need = needs[index];
  if (!need) return;

  const text = encodeURIComponent(`${need.type.toUpperCase()} - ${need.name}: ${need.details}`);
  let url;
  if (platform === 'facebook') {
    url = `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${text}`;
  } else if (platform === 'instagram') {
    url = `https://www.instagram.com/?url=${window.location.href}&title=${text}`;
  }
  window.open(url, '_blank');
}

// LOAD PAGE DATA
if (document.getElementById('ann-list')) renderAnnouncements();
if (document.getElementById('prayer-list')) renderPrayers();
if (document.getElementById('needs-list')) renderNeeds();
if (document.getElementById('events-list')) {
  initializeDefaultEvents();
  renderEvents();
}
