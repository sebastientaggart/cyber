// Picked up by @parcel/transformer-pug via config.getConfig().
// Locals exposed here are available to every src/*.pug entry and any include they pull in.
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const mdFootnote = require('markdown-it-footnote');
const sanitizeHtml = require('sanitize-html');

// Single markdown renderer used for both the HICP roadmap (Phase 2) and post bodies (Phase 3).
// `html: true` lets inline `<u>` and `<strong>` tags from the source data pass through.
// `markdown-it-footnote` adds support for the `[^N]` syntax used in 3 of 41 posts.
const md = new MarkdownIt({ html: true, linkify: false, typographer: false }).use(mdFootnote);

// Migration note: this base points to legacy 405(d)-owned media that still lives
// on 405d.hhs.gov. As ownership/content is moved to hhscyber.hhs.gov, replace
// these references with the new canonical host and remove this compatibility path.
const RESOURCE_URL_BASE = 'https://405d.hhs.gov/blog';
const RESOURCE_URL_TOKEN_BASE = `${RESOURCE_URL_BASE}/`;

// Allowlist for sanitize-html. Mirrors the tags markdown-it can produce plus the
// inline HTML used by the source data (`<u>` from the HICP roadmap, etc.).
const ALLOWED_TAGS = [
  'u', 'strong', 'em', 'b', 'i', 'a', 'br', 'p', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'blockquote', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'code', 'pre', 'sup', 'sub', 'span', 'section', 'div',
];
const ALLOWED_ATTRS = {
  a:   ['href', 'target', 'rel', 'name', 'id'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['id', 'class', 'aria-label', 'aria-labelledby', 'role'],
};
const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRS,
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
};

function renderMarkdown(rawMarkdown) {
  const html = md.render(rawMarkdown || '');
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

function renderPostBody(contentArray) {
  const raw = (contentArray || []).join('\n').replace(/\{\{RESOURCE_URL\}\}/g, RESOURCE_URL_TOKEN_BASE);
  return renderMarkdown(raw);
}

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(__dirname, p), 'utf8'));

// =============================================================================
// Phase 2 — HICP roadmap (markdown rendering migrated from `marked` to markdown-it)
// =============================================================================
const roadmapData = readJSON('src/data/cybersecurity-roadmap.json');
const roadmapDescriptions = roadmapData.descriptions.map((d) => ({
  title: d.title || '',
  html: d.detail ? renderMarkdown(d.detail) : '',
}));

// =============================================================================
// Phase 3 — live snapshots (run `pnpm run fetch-content` to refresh)
// =============================================================================
const resources = readJSON('src/data/resources.json')
  .filter((r) => r.published && r.category !== '*Post');
const archivedResources = readJSON('src/data/archived-resources.json');
const postsRaw = readJSON('src/data/posts.json').filter((p) => p.published);
const posts = postsRaw.map((p) => ({ ...p, htmlContent: renderPostBody(p.content) }));
const notices = readJSON('src/data/notices.json');

// =============================================================================
// Phase 4 — home page main links, stats, and "New" badge precomputation
// =============================================================================
const homePageContent = readJSON('src/data/home-page-content.json');

// Pre-compute "New" badge flags so templates don't need runtime date math.
// 405d uses `moment().subtract(1, 'd')` as the cutoff — we use the same logic.
const YESTERDAY_ISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
homePageContent.mainLinks.forEach((card) => {
  card.links.forEach((link) => {
    if (link.hilightTill && link.hilightTill > YESTERDAY_ISO) {
      link.isNew = true;
    }
  });
});

module.exports = {
  locals: {
    // Phase 1 data
    pageContents:     readJSON('src/data/page-contents.json'),
    aboutUs:          readJSON('src/data/about-us.json'),
    spanishResources: readJSON('src/data/spanish-resources.json'),

    // Phase 2 data
    roadmap:          roadmapData,
    roadmapDescriptions,
    top5Threats:      readJSON('src/data/top5-threats.json'),
    practices:        readJSON('src/data/practices.json'),
    kodItems:         readJSON('src/data/kod-items.json'),

    // Phase 3 data
    resources,
    archivedResources,
    posts,
    notices,

    // Phase 4 data
    homePageContent,

    site: {
      name:    'HHS Cyber Gateway',
      mailto:  'cisa405d@hhs.gov',
      version: '3.3.0',
    },

    // Maps aboutUs.partners[].id → filename under src/images/logos/
    partnerLogoMap: {
      'HHS':    'logo-hhs.png',
      'HC3':    'logo-hc3.png',
      'ASPR':   'logo-aspr.png',
      'ONC':    'logo-onc.svg',
      'HSCC':   'logo-hscc.png',
      'CISA':   'logo-cisa.png',
      'FDA':    'logo-fda.png',
      'OCR':    'logo-ocr.png',
      'CMS':    'logo-cms.svg',
      'ARPA-H': 'logo-arpa-h.png',
      'ONS':    'logo-ons.png',
    },

    // Maps top5Threats.<key> → filename under src/images/threats/
    threatIconMap: {
      social:     'social-engineering.png',
      ransomware: 'ransomware.png',
      theft:      'loss-or-theft.png',
      dataloss:   'data-loss.png',
      attack:     'medical-devices.png',
    },

    // Maps practices[].icon → filename under src/images/practices/
    practiceIconMap: {
      iconEmail:                                       'email.png',
      iconEndpointProtection:                          'endpoint.png',
      iconIdentityAndAccessManagement:                 'iam.png',
      iconDataProtectionLossPrevention:                'data-protection.png',
      iconITAssetManagement:                           'asset-management.png',
      iconNetworkManagement:                           'network.png',
      iconVulnerabilityManagement:                     'vulnerability.png',
      iconSecurityOperationsCenterAndIncidentResponse: 'soc-ir.png',
      iconMedicalDeviceSecurity:                       'medical-device.png',
      iconCybersecurityOversightAndGovernance:         'governance.png',
    },

    // Maps kodItems[].link → filename under src/images/kod/ for the launch button
    kodLaunchImageMap: {
      'social-engineering': 'launch-social-engineering.png',
      'ransomware':         'launch-ransomware.png',
      'equipment-theft':    'launch-loss-or-theft.png',
      'data-loss':          'launch-data-loss.png',
      'attack':             'launch-medical-devices.png',
    },

    // Maps kodItems[].link → filename under src/images/kod/ for the small threat tile
    kodThreatTileMap: {
      'social-engineering': 'threat-social-engineering.png',
      'ransomware':         'threat-ransomware.png',
      'equipment-theft':    'threat-loss-or-theft.png',
      'data-loss':          'threat-data-loss.png',
      'attack':             'threat-medical-devices.png',
    },

    // Phase 3 — fixed resource categories surfaced in the filter chips and footer
    resourceCategories: ['Toolkits', 'Poster', 'Publications', 'Webinars', 'SBARs', 'Newsletter', 'Infographics'],
    resourceImageBase: RESOURCE_URL_BASE,

    // Phase 4 — home page main link icon map (light + dark-on-hover pair)
    homeLinkIconMap: {
      publication:  { light: 'publication.png',  dark: 'publication-dark.png' },
      education:    { light: 'education.png',    dark: 'education-dark.png' },
      practitioner: { light: 'practitioner.png', dark: 'practitioner-dark.png' },
      poster:       { light: 'poster.png',       dark: 'poster-dark.png' },
      itprof:       { light: 'itprof.png',       dark: 'itprof-dark.png' },
      icymi:        { light: 'icymi.png',        dark: 'icymi-dark.png' },
    },
  },
};
