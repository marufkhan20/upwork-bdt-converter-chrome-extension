document.addEventListener('DOMContentLoaded', () => {
  const rateInput = document.getElementById('rate');
  const feeInput = document.getElementById('fee');
  const saveBtn = document.getElementById('save');
  const status = document.getElementById('status');

  // Default values
  const DEFAULTS = {
    conversionRate: 120,
    feePercentage: 15
  };

  // Load existing settings
  chrome.storage.local.get(['conversionRate', 'feePercentage'], (result) => {
    rateInput.value = result.conversionRate || DEFAULTS.conversionRate;
    feeInput.value = result.feePercentage !== undefined ? result.feePercentage : DEFAULTS.feePercentage;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const rate = parseFloat(rateInput.value);
    const fee = parseFloat(feeInput.value);

    if (isNaN(rate) || isNaN(fee)) {
      showStatus('Invalid input. Please enter numbers.', 'error');
      return;
    }

    chrome.storage.local.set({
      conversionRate: rate,
      feePercentage: fee
    }, () => {
      showStatus('Settings saved!', 'success');
      
      // Auto-hide status after 2 seconds
      setTimeout(() => {
        status.classList.remove('show');
      }, 2000);
    });
  });

  function showStatus(msg, type) {
    status.innerText = msg;
    status.style.color = type === 'error' ? '#d32f2f' : '#14a800';
    status.classList.add('show');
  }
});
