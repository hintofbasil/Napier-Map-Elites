var emailScramble = require('email-scramble');

document.addEventListener('DOMContentLoaded', () => {
  var emails = document.querySelectorAll('[data-email-scramble]');
  emails.forEach((e) => {
    e.innerHTML = emailScramble.rot(26-17, 0, e.innerHTML);
  });
});
