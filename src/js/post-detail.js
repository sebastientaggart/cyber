// Post detail hash router.
// `post-detail.pug` embeds all posts as JSON in `<script type="application/json" id="posts-data">`.
// This script reads `location.hash` (`#post-<uuid>` or `#<uuid>`), finds the
// matching post, and populates the DOM shell. Re-renders on `hashchange`.
// No-op if there's no `#posts-data` blob on the page.

import { isSafeAssetUrl, isSafeHttpUrl } from './url-utils.js';

const SITE_NAME = 'HHS Cyber Gateway';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (_) {
    return '';
  }
}

function setText(root, field, value) {
  const el = root.querySelector(`[data-field="${field}"]`);
  if (el) el.textContent = value || '';
}

function initPostDetail() {
  const blob = document.getElementById('posts-data');
  const shell = document.getElementById('post-shell');
  const notFound = document.getElementById('post-not-found');
  if (!blob || !shell) return;

  let posts;
  try {
    posts = JSON.parse(blob.textContent);
  } catch (e) {
    console.error('failed to parse posts JSON', e);
    return;
  }

  function getRequestedId() {
    const raw = (window.location.hash || '').replace(/^#/, '');
    return raw.replace(/^post-/, '');
  }

  function render() {
    const id = getRequestedId();
    const post = id ? posts.find((p) => p.id === id) : posts[0];
    if (!post) {
      shell.hidden = true;
      if (notFound) notFound.hidden = false;
      return;
    }
    shell.hidden = false;
    if (notFound) notFound.hidden = true;

    setText(shell, 'title', post.title);
    setText(shell, 'date', formatDate(post.date));
    setText(shell, 'category', post.category || '');
    setText(shell, 'author', post.author ? `By ${post.author}` : '');

    // Body — uses sanitized HTML pre-rendered at build time (markdown-it + sanitize-html)
    const bodyEl = shell.querySelector('[data-field="content"]');
    if (bodyEl) bodyEl.innerHTML = post.htmlContent || '';

    // Optional download button
    const dl = shell.querySelector('[data-field="download"]');
    if (dl) {
      if (post.link && isSafeHttpUrl(post.link)) {
        dl.hidden = false;
        dl.href = post.link;
        dl.rel = 'noopener noreferrer';
      } else {
        dl.hidden = true;
      }
    }

    // Optional header image
    const hero = shell.querySelector('[data-field="header-image"]');
    if (hero) {
      if (post.headerImage && isSafeAssetUrl(post.headerImage)) {
        hero.hidden = false;
        hero.src = post.headerImage;
        hero.alt = post.title || '';
      } else {
        hero.hidden = true;
        hero.removeAttribute('src');
      }
    }

    // Update document title for the active post
    document.title = `${SITE_NAME} | ${post.title}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  window.addEventListener('hashchange', render);
  render();
}

if (document.readyState === 'complete') {
  initPostDetail();
} else {
  window.addEventListener('load', initPostDetail);
}
