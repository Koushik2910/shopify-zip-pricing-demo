/**
 * zip-price-widget.js
 * Upload this file to: Shopify Admin > Online Store > Themes > Edit Code > Assets
 * Then include it in your theme.liquid or product.liquid:
 *   <script src="{{ 'zip-price-widget.js' | asset_url }}" defer></script>
 *
 * Also add the HTML below to your product-template or product section liquid file,
 * right below where {{ product.price | money }} is rendered:
 *
 *   <div id="zip-price-widget" data-product-id="{{ product.id }}">
 *     <div class="zpw-price-row">
 *       <span class="zpw-label">Price:</span>
 *       <span id="zpw-price">{{ product.price | money }}</span>
 *     </div>
 *     <div class="zpw-row">
 *       <input type="text" id="zpw-input" placeholder="Enter ZIP code" maxlength="10" />
 *       <button id="zpw-btn" type="button">Check Price</button>
 *     </div>
 *     <p id="zpw-status" role="status" aria-live="polite"></p>
 *   </div>
 */

(function () {
  'use strict';

  // ─── CONFIGURE THIS ────────────────────────────────────────────────────────
  var API_BASE_URL = 'https://your-app.up.railway.app';
  // ───────────────────────────────────────────────────────────────────────────

  var styles = `
    #zip-price-widget { margin: 16px 0; font-family: inherit; }
    .zpw-price-row    { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .zpw-label        { font-size: 14px; color: #6b7280; }
    #zpw-price        { font-size: 24px; font-weight: 700; color: #111827; transition: opacity .2s; }
    #zpw-price.dim    { opacity: .4; }
    .zpw-row          { display: flex; gap: 8px; align-items: center; }
    #zpw-input {
      border: 1px solid #d1d5db; border-radius: 6px;
      padding: 10px 14px; font-size: 15px; width: 150px; outline: none;
    }
    #zpw-input:focus  { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.15); }
    #zpw-btn {
      background: #111827; color: #fff; border: none; border-radius: 6px;
      padding: 10px 20px; font-size: 15px; font-weight: 600; cursor: pointer;
    }
    #zpw-btn:hover    { background: #374151; }
    #zpw-btn:disabled { opacity: .55; cursor: not-allowed; }
    #zpw-status       { margin-top: 8px; font-size: 13px; min-height: 18px; }
    #zpw-status.ok    { color: #16a34a; }
    #zpw-status.err   { color: #dc2626; }
    #zpw-status.wait  { color: #6b7280; }
  `;

  function injectStyles() {
    var el = document.createElement('style');
    el.textContent = styles;
    document.head.appendChild(el);
  }

  function init() {
    var widget = document.getElementById('zip-price-widget');
    if (!widget) return;

    injectStyles();

    var productId = widget.dataset.productId || '';
    var input     = document.getElementById('zpw-input');
    var btn       = document.getElementById('zpw-btn');
    var priceEl   = document.getElementById('zpw-price');
    var statusEl  = document.getElementById('zpw-status');

    if (!input || !btn || !priceEl || !statusEl) {
      console.warn('[ZIP Pricing] Missing required HTML elements.');
      return;
    }

    function setStatus(text, cls) {
      statusEl.textContent = text;
      statusEl.className   = cls || '';
    }

    function checkPrice() {
      var zip = input.value.trim();

      if (!zip) {
        setStatus('Please enter a ZIP code.', 'err');
        input.focus();
        return;
      }
      if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        setStatus('Please enter a valid 5-digit ZIP code.', 'err');
        input.focus();
        return;
      }

      btn.disabled        = true;
      btn.textContent     = 'Checking…';
      priceEl.classList.add('dim');
      setStatus('Fetching price…', 'wait');

      fetch(API_BASE_URL + '/api/get-price', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId: productId, zipCode: zip }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          priceEl.textContent = '$' + Number(data.price).toLocaleString('en-US');
          setStatus('Price shown for ZIP ' + zip + '.', 'ok');
        })
        .catch(function (err) {
          console.error('[ZIP Pricing] fetch error:', err);
          setStatus('Could not fetch price. Please try again.', 'err');
        })
        .finally(function () {
          btn.disabled    = false;
          btn.textContent = 'Check Price';
          priceEl.classList.remove('dim');
        });
    }

    btn.addEventListener('click', checkPrice);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') checkPrice();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
