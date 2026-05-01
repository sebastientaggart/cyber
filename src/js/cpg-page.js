// Cybersecurity Performance Goals — expand/collapse all per column (Bootstrap Collapse).
function updateColumnToolbar(col, collapses, expandBtns, collapseBtns) {
  const allShown = collapses.length > 0 && collapses.every((el) => el.classList.contains('show'));
  const allHidden = collapses.every((el) => !el.classList.contains('show'));
  expandBtns.forEach((b) => {
    b.disabled = allShown;
  });
  collapseBtns.forEach((b) => {
    b.disabled = allHidden;
  });
}

function initCpgColumns() {
  if (!window.bootstrap?.Collapse) return;

  document.querySelectorAll('.js-cpg-column').forEach((col) => {
    const collapses = [...col.querySelectorAll('.collapse')];
    const expandBtns = col.querySelectorAll('[data-cpg-action="expand"]');
    const collapseBtns = col.querySelectorAll('[data-cpg-action="collapse"]');

    const sync = () => updateColumnToolbar(col, collapses, expandBtns, collapseBtns);

    expandBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        collapses.forEach((el) => {
          window.bootstrap.Collapse.getOrCreateInstance(el, { toggle: false }).show();
        });
        sync();
      });
    });
    collapseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        collapses.forEach((el) => {
          window.bootstrap.Collapse.getOrCreateInstance(el, { toggle: false }).hide();
        });
        sync();
      });
    });

    collapses.forEach((el) => {
      el.addEventListener('shown.bs.collapse', sync);
      el.addEventListener('hidden.bs.collapse', sync);
    });
    sync();
  });
}

initCpgColumns();
