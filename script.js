document.addEventListener('DOMContentLoaded', function() {
  const allButtons = document.querySelectorAll('.btn-card');
  let uploadBtn, vragenlijstBtn, zoekenBtn;
  
  allButtons.forEach(btn => {
    const text = btn.textContent.trim();
    if (text.includes('Document') && text.includes('uploaden')) uploadBtn = btn;
    else if (text.includes('Start') && text.includes('vragenlijst')) vragenlijstBtn = btn;
    else if (text.includes('Begin') && text.includes('zoeken')) zoekenBtn = btn;
  });
  
  // Document upload
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pdf,.doc,.docx';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  if (uploadBtn) uploadBtn.addEventListener('click', e => { e.preventDefault(); fileInput.click(); });
  fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) {
      alert('Document geüpload: ' + e.target.files[0].name);
      fileInput.value = '';
    }
  });
  
  // Vragenlijst (Bingli)
  if (vragenlijstBtn) vragenlijstBtn.addEventListener('click', e => {
    e.preventDefault();
    window.open('https://chat.bingli.eu/#/consent', '_blank');
  });
  
  // Zoeken modal
  if (zoekenBtn) zoekenBtn.addEventListener('click', e => {
    e.preventDefault();
    // Modal code hier...
  });
});
