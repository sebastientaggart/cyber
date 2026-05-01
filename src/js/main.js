// HHS Cyber Gateway — site JS entry.
// Load only feature modules needed by the current page.
import './animate.js';

const has = (selector) => !!document.querySelector(selector);

if (has('.cybersecurity-roadmap__hotspot')) {
  import('./hicp-roadmap.js');
}

if (has('.kod-quick-shots__grid')) {
  import('./kod-quick-shots.js');
}

if (has('.tag-cloud')) {
  import('./tag-cloud.js');
}

if (has('.resources-page .resource-grid')) {
  import('./resources.js');
}

if (has('.post-list')) {
  import('./post.js');
}

if (has('#posts-data')) {
  import('./post-detail.js');
}

if (has('#notices-data')) {
  import('./notices.js');
}

if (document.body.classList.contains('page-cybersecurity-performance-goals')) {
  import('./cpg-page.js');
}
