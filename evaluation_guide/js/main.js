/* ============================================
   Echoes Phone — Evaluation Guide JS
   Language switch, nav, accordions, form, reveal
   ============================================ */

(function () {
  'use strict';

  // ---------- Language ----------
  const body = document.body;
  let currentLang = 'zh';

  function getElText(el, lang) {
    const key = 'data-' + lang;
    return el.hasAttribute(key) ? el.getAttribute(key) : null;
  }

  function getAttrText(el, attr, lang) {
    const key = attr + '-' + lang;
    return el.hasAttribute(key) ? el.getAttribute(key) : null;
  }

  function switchLang(lang) {
    currentLang = lang;
    body.setAttribute('data-lang', lang);

    // Update all [data-zh][data-en] elements
    document.querySelectorAll('[data-zh][data-en]').forEach(function (el) {
      var txt = getElText(el, lang);
      if (txt !== null) {
        // Only replace if it's a simple text node child or the element only contains text
        if (el.children.length === 0) {
          el.textContent = txt;
        } else {
          // Try to find a direct text node
          var cn = el.childNodes;
          for (var i = 0; i < cn.length; i++) {
            if (cn[i].nodeType === 3 && cn[i].textContent.trim()) {
              cn[i].textContent = txt;
              break;
            }
          }
        }
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-zh][data-en]').forEach(function (el) {
      if (el.hasAttribute('placeholder')) {
        var p = getAttrText(el, 'placeholder', lang);
        if (p) el.setAttribute('placeholder', p);
      }
    });

    // Update lang buttons
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-l') === lang);
    });

    // Update select options
    document.querySelectorAll('select option[data-zh][data-en]').forEach(function (opt) {
      var t = getElText(opt, lang);
      if (t) opt.textContent = t;
    });
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchLang(this.getAttribute('data-l'));
    });
  });

  // ---------- Nav ----------
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('nav-open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      navLinks.classList.remove('nav-open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // ---------- Day Accordion ----------
  document.querySelectorAll('.day-summary').forEach(function (btn) {
    btn.addEventListener('click', function () {
      this.parentElement.classList.toggle('open');
    });
  });

  // ---------- FAQ Accordion ----------
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      this.parentElement.classList.toggle('open');
    });
  });

  // ---------- Upload ----------
  var uploadZone = document.getElementById('uploadZone');
  var fileInput = document.getElementById('fileInput');
  var previews = document.getElementById('uploadPreviews');
  var selectedFiles = [];

  uploadZone.addEventListener('click', function () { fileInput.click(); });
  uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
  uploadZone.addEventListener('drop', function (e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', function () { handleFiles(this.files); });

  function handleFiles(files) {
    Array.from(files).forEach(function (file) {
      if (!file.type.match(/^image\/(png|jpeg|gif|webp)$/)) return;
      if (file.size > 5 * 1024 * 1024) return; // 5MB limit
      selectedFiles.push(file);
      renderPreview(file);
    });
  }

  function renderPreview(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var wrap = document.createElement('div');
      wrap.className = 'upload-preview';
      var img = document.createElement('img');
      img.src = e.target.result;
      var rm = document.createElement('button');
      rm.className = 'rm-btn';
      rm.textContent = '×';
      rm.title = 'Remove';
      rm.addEventListener('click', function (ev) {
        ev.stopPropagation();
        wrap.remove();
        var idx = selectedFiles.indexOf(file);
        if (idx > -1) selectedFiles.splice(idx, 1);
      });
      wrap.appendChild(img);
      wrap.appendChild(rm);
      previews.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  }

  // ---------- Form Submit ----------
  var form = document.getElementById('feedbackForm');
  var statusEl = document.getElementById('formStatus');
  var submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitBtn.disabled = true;
    statusEl.className = 'form-status';
    statusEl.style.display = 'none';

    var name = document.getElementById('nameInput').value.trim() || 'Anonymous';
    var day = document.getElementById('daySelect').value;
    var message = document.getElementById('msgText').value.trim();

    if (!message && selectedFiles.length === 0) {
      statusEl.className = 'form-status error';
      statusEl.textContent = currentLang === 'zh' ? '请至少输入文字或上传截图。' : 'Please enter text or upload at least one screenshot.';
      statusEl.style.display = 'block';
      submitBtn.disabled = false;
      return;
    }

    // Use FormSubmit.co to send email to bcx0216@gmail.com
    // FormSubmit endpoint: https://formsubmit.co/bcx0216@gmail.com
    var formData = new FormData();
    formData.append('_subject', '[Echoes Study] ' + name + ' — ' + day);
    formData.append('_captcha', 'false');
    formData.append('_template', 'table');
    formData.append('Name', name);
    formData.append('Day', day);
    formData.append('Message', message);

    selectedFiles.forEach(function (f) {
      formData.append('attachment', f);
    });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://formsubmit.co/bcx0216@gmail.com', true);
    xhr.onload = function () {
      submitBtn.disabled = false;
      if (xhr.status === 200 || xhr.status === 201 || xhr.status === 302) {
        statusEl.className = 'form-status success';
        statusEl.textContent = currentLang === 'zh'
          ? '✓ 发送成功！感谢你的反馈。'
          : '✓ Sent! Thank you for your feedback.';
        statusEl.style.display = 'block';
        // Reset
        document.getElementById('msgText').value = '';
        selectedFiles = [];
        previews.innerHTML = '';
        fileInput.value = '';
      } else {
        statusEl.className = 'form-status error';
        statusEl.textContent = currentLang === 'zh'
          ? '发送失败，请通过 IM 联系研究者。'
          : 'Send failed. Please contact the researcher via IM.';
        statusEl.style.display = 'block';
      }
    };
    xhr.onerror = function () {
      submitBtn.disabled = false;
      statusEl.className = 'form-status error';
      statusEl.textContent = currentLang === 'zh'
        ? '网络错误，请通过 IM 联系研究者。'
        : 'Network error. Please contact the researcher via IM.';
      statusEl.style.display = 'block';
    };
    xhr.send(formData);
  });
})();
