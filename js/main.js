// позначаємо, що JavaScript працює (без нього анімація появи не приховує вміст)
document.documentElement.classList.add('js');

// Бургер-меню: відкриття і закриття навігації на мобільних екранах
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');

function closeMenu() {
  burger.classList.remove('burger--active');
  nav.classList.remove('nav--open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Відкрити меню');
  document.body.classList.remove('no-scroll');
}

burger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('nav--open');
  burger.classList.toggle('burger--active', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  burger.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
  document.body.classList.toggle('no-scroll', isOpen);
});

// Закриваємо меню після переходу за посиланням
nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

// Закриваємо меню клавішею Escape
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

// ===== ЛР4. Фонове відео: ліниве завантаження і кнопка паузи =====
const bgVideo = document.querySelector('.video-banner__video');
const videoToggle = document.querySelector('.video-banner__toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadVideo() {
  // підставляємо адреси файлів лише тоді, коли секція з'являється на екрані
  bgVideo.querySelectorAll('source').forEach((source) => {
    source.src = source.dataset.src;
  });
  bgVideo.load();
  bgVideo.play().catch(() => {});
}

if (bgVideo && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadVideo();
      observer.disconnect();
    }
  }, { rootMargin: '200px' });
  observer.observe(bgVideo);

  videoToggle.addEventListener('click', () => {
    const paused = !bgVideo.paused;
    if (paused) {
      bgVideo.pause();
    } else {
      bgVideo.play();
    }
    videoToggle.setAttribute('aria-pressed', String(paused));
    videoToggle.querySelector('.video-banner__toggle-icon').textContent = paused ? '▶' : '❚❚';
    videoToggle.querySelector('.video-banner__toggle-text').textContent = paused ? 'Відтворити відео' : 'Пауза відео';
  });
}

// ===== ЛР5. Форма заявки: перевірка полів і відправка =====
const form = document.querySelector('#order-form');

if (form) {
  const fields = form.querySelectorAll('input[required], select[required], input[type="email"]');
  const status = form.querySelector('.order-form__status');
  const submitBtn = form.querySelector('.order-form__submit');
  const comment = form.querySelector('#f-comment');
  const counter = form.querySelector('#f-comment-counter span');
  const dateInput = form.querySelector('#f-date');

  // дата перевезення — не раніше сьогодні і не пізніше ніж через 90 днів
  const today = new Date();
  const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = toISO(today);
  dateInput.max = toISO(new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000));

  // власні повідомлення про помилки українською
  function getMessage(field) {
    const v = field.validity;
    if (v.valueMissing) {
      if (field.type === 'checkbox') return 'Потрібна ваша згода, щоб ми могли зв’язатися з вами.';
      if (field.tagName === 'SELECT') return 'Оберіть тип вантажу.';
      return 'Заповніть це поле.';
    }
    if (v.tooShort) return `Мінімум ${field.minLength} символи.`;
    if (v.typeMismatch && field.type === 'email') return 'Введіть email у форматі name@example.com.';
    if ((v.patternMismatch || v.customError) && field.type === 'tel') return 'Введіть номер у форматі +380 67 123 45 67.';
    if (v.rangeUnderflow) return field.type === 'date' ? 'Оберіть сьогоднішню або пізнішу дату.' : `Мінімальне значення — ${field.min}.`;
    if (v.rangeOverflow) return field.type === 'date' ? 'Приймаємо заявки не більше ніж на 90 днів наперед.' : `Максимум ${field.max} т — для більшої ваги зателефонуйте нам.`;
    if (v.stepMismatch || v.badInput) return 'Введіть число, наприклад 2 або 2.5.';
    return '';
  }

  // український номер: після очищення від пробілів і дужок має бути 0XXXXXXXXX або 380XXXXXXXXX
  function checkPhone(field) {
    const digits = field.value.replace(/\D/g, '');
    const ok = field.value === '' || /^(38)?0\d{9}$/.test(digits);
    field.setCustomValidity(ok ? '' : 'phone');
  }

  function validateField(field) {
    if (field.type === 'tel') checkPhone(field);
    const error = form.querySelector(`#${field.getAttribute('aria-describedby')}`);
    const valid = field.checkValidity();
    field.classList.toggle('is-invalid', !valid);
    field.classList.toggle('is-valid', valid && field.value !== '' && field.type !== 'checkbox');
    field.setAttribute('aria-invalid', String(!valid));
    if (error) error.textContent = valid ? '' : getMessage(field);
    return valid;
  }

  fields.forEach((field) => {
    // перевіряємо поле, коли користувач з нього виходить
    field.addEventListener('blur', () => validateField(field));
    // і одразу прибираємо помилку, щойно її виправили
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) validateField(field);
    });
    field.addEventListener('change', () => validateField(field));
  });

  comment.addEventListener('input', () => {
    counter.textContent = comment.value.length;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.className = 'order-form__status';
    status.textContent = '';

    let firstInvalid = null;
    fields.forEach((field) => {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    submitBtn.disabled = true;
    submitBtn.textContent = 'Надсилаємо…';
    submitBtn.classList.add('is-loading');

    try {
      if (form.dataset.demo === 'true') {
        // демо-режим: імітуємо відповідь сервера
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.log('Заявка (демо-режим):', data);
      } else {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(response.status);
      }
      status.classList.add('order-form__status--success');
      status.textContent = `Дякуємо, ${data.name}! Заявку прийнято, менеджер зателефонує вам протягом 15 хвилин.`;
      form.reset();
      counter.textContent = '0';
      form.querySelectorAll('.is-valid').forEach((el) => el.classList.remove('is-valid'));
    } catch (err) {
      status.classList.add('order-form__status--error');
      status.textContent = 'Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте: +38 (067) 123-45-67.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Надіслати заявку';
      submitBtn.classList.remove('is-loading');
    }
  });
}

// ===== ЛР7. Поява блоків при прокручуванні =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealItems = document.querySelectorAll(
    '.section__heading, .cards > *, .table-wrap, .order__info, .order-form, .video-banner__inner'
  );

  revealItems.forEach((item) => {
    item.classList.add('reveal');
    // картки в одному ряду з'являються по черзі із затримкою 0,1 с
    if (item.parentElement.classList.contains('cards')) {
      const index = [...item.parentElement.children].indexOf(item);
      item.style.setProperty('--delay', `${index * 0.1}s`);
    }
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target); // анімація відтворюється лише один раз
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
}
