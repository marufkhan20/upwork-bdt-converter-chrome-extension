(function() {
  let settings = {
    conversionRate: 120,
    feePercentage: 15
  };

  // Load initial settings
  chrome.storage.local.get(['conversionRate', 'feePercentage'], (result) => {
    if (result.conversionRate) settings.conversionRate = result.conversionRate;
    if (result.feePercentage !== undefined) settings.feePercentage = result.feePercentage;
    updateAllConversions();
  });

  // Listen for setting changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.conversionRate) settings.conversionRate = changes.conversionRate.newValue;
    if (changes.feePercentage) settings.feePercentage = changes.feePercentage.newValue;
    updateAllConversions();
  });

  function formatBDT(amount) {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2
    }).format(amount);
  }

  let isUpdating = false;

  function updateAllConversions() {
    if (isUpdating) return;
    isUpdating = true;

    // 1. Target Contract Earnings (WITH FEE)
    const contractLinks = document.querySelectorAll('a[data-ev-label="time_worked"]');
    contractLinks.forEach(link => {
      const parent = link.parentElement;
      if (!parent) return;

      const spans = Array.from(parent.querySelectorAll('span'));
      const thisWeekSpan = spans.find(s => s.textContent.trim().includes('this week'));
      if (!thisWeekSpan) return;

      const match = link.textContent.match(/\$([0-9,]+\.[0-9]{2})/);
      if (!match) return;

      const usdValue = match[1];
      const bdtValue = calculateBDT(usdValue, true); // apply fee
      
      if (bdtValue !== null) {
        updateOrInjectDisplay(thisWeekSpan, bdtValue, 'after');
      }
    });

    // 2. Target Available Earnings (WITHOUT FEE)
    const availableLinks = document.querySelectorAll('a[data-ev-label="earnings_available_click"]');
    availableLinks.forEach(link => {
      const match = link.textContent.match(/\$([0-9,]+\.[0-9]{2})/);
      if (!match) return;

      const usdValue = match[1];
      const bdtValue = calculateBDT(usdValue, false); // no fee
      
      if (bdtValue !== null) {
        updateOrInjectDisplay(link, bdtValue, 'after');
      }
    });

    isUpdating = false;
  }

  function updateOrInjectDisplay(targetElement, bdtValue, position) {
    const parent = targetElement.parentElement;
    if (!parent) return;

    const bdtText = ` (৳${bdtValue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    
    let bdtDisplay = parent.querySelector('.upwork-bdt-display');
    if (!bdtDisplay) {
      bdtDisplay = document.createElement('span');
      bdtDisplay.className = 'upwork-bdt-display';
      bdtDisplay.style.marginLeft = '4px';
      bdtDisplay.style.color = '#14a800';
      bdtDisplay.style.fontStyle = 'italic';
      bdtDisplay.style.fontSize = '0.9em';
      bdtDisplay.style.fontWeight = '600';
      
      if (position === 'after') {
        targetElement.after(bdtDisplay);
      } else {
        targetElement.before(bdtDisplay);
      }
    }
    
    if (bdtDisplay.textContent !== bdtText) {
      bdtDisplay.textContent = bdtText;
    }
  }

  function calculateBDT(usdStr, applyFee) {
    const amount = parseFloat(usdStr.replace(/[$,]/g, ''));
    if (isNaN(amount)) return null;
    
    let bdt = amount * settings.conversionRate;
    if (applyFee) {
      bdt = bdt * (1 - settings.feePercentage / 100);
    }
    return bdt;
  }

  // Observe DOM changes to handle SPA navigation with debounce
  let observerTimeout;
  const observer = new MutationObserver((mutations) => {
    // Basic filter: ignore mutations to our own injected elements
    const isOurMutation = mutations.every(m => 
      (m.target && m.target.classList && m.target.classList.contains('upwork-bdt-display')) ||
      (m.addedNodes && Array.from(m.addedNodes).every(n => n.classList && n.classList.contains('upwork-bdt-display')))
    );

    if (isOurMutation) return;

    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(updateAllConversions, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial call
  updateAllConversions();
})();
