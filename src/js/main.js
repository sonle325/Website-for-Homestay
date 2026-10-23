/**
 * LAL ANGLE HOMESTAY · MAIN APPLICATION ENTRY
 * Modular Source Architecture
 */

import { initDateDefaults, initQuickSearch, initCostCalculator, initReservationForm, chooseRoom, closeSuccessModal } from './booking.js';
import { syncRoomsUI } from './rooms.js';
import { initOwnerSettings, closeOwnerModal, switchOwnerTab, handleRoomToggle } from './admin.js';

// Expose handlers to global window for inline HTML attributes (onclick)
window.chooseRoom = chooseRoom;
window.closeSuccessModal = closeSuccessModal;
window.closeOwnerModal = closeOwnerModal;
window.switchOwnerTab = switchOwnerTab;
window.handleRoomToggle = handleRoomToggle;

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initDateDefaults();
  initQuickSearch();
  initCostCalculator();
  initReservationForm();
  syncRoomsUI();
  initOwnerSettings();
});

/* ==========================================================================
   MENU TRÊN THIẾT BỊ DI ĐỘNG
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navItems = document.querySelectorAll('.nav-item');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = toggleBtn.querySelector('i');
      if (navMenu.classList.contains('open')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });
  }
}
