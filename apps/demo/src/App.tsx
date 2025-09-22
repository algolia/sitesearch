import { SiteSearchExperience } from '@algolia/sitesearch-react';
import '@algolia/sitesearch-react/dist/sitesearch.css';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <AlgoliaLogo size={124} />
          <p className="hero-subtitle">
            Drop-in search widget with AI-powered chat for modern websites
          </p>
          <p className="hero-description">
            Try it out: <kbd>Cmd/Ctrl + K</kbd> or click the search button below
          </p>
        </div>
      </header>

      <div className="main-container">
        <aside className="demo-sidebar">
          <div className="demo-sticky">
            <div className="demo-section">
              <h2>Live Demo</h2>
              <p>Experience the search widget in action:</p>
              <div className="demo-widget">
                <SiteSearchExperience
                  applicationId="betaHAXPMHIMMC"
                  apiKey="8b00405cba281a7d800ccec393e9af24"
                  indexName="algolia_podcast_sample_dataset"
                  assistantId="Z03Eno3oLaXI"
                  placeholder="Search for podcasts..."
                  hitsPerPage={6}
                  keyboardShortcut="cmd+k"
                  buttonText="🎧 Search Podcasts"
                />
              </div>
              <div className="demo-features">
                <h3>Features</h3>
                <ul>
                  <li>⚡ Instant search results</li>
                  <li>🤖 AI-powered chat assistance</li>
                  <li>⌨️ Full keyboard navigation</li>
                  <li>🎨 Beautiful, accessible UI</li>
                  <li>📱 Mobile-responsive design</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>

        <main className="content">
          <section className="usage-section">
            <h2>Quick Start</h2>
            <p className="section-intro">
              Our philosophy is simple: copy components, customize freely.
              No complex configuration, just grab what you need and make it yours.
            </p>

            <div className="usage-step">
              <h3>1. Install Dependencies</h3>
              <div className="code-block">
                <div className="code-header">
                  <span>Terminal</span>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText('npm install @ai-sdk/react ai algoliasearch react-instantsearch marked')}>
                    Copy
                  </button>
                </div>
                <pre><code>{`npm install @ai-sdk/react ai algoliasearch react-instantsearch marked`}</code></pre>
              </div>
            </div>

            <div className="usage-step">
              <h3>2. Use the Complete Experience</h3>
              <p>Perfect for most use cases - a complete search experience with button, modal, and AI chat:</p>
              <div className="code-block">
                <div className="code-header">
                  <span>App.tsx</span>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(`import { SiteSearchExperience } from './components/sitesearch';
import './sitesearch.css';

function App() {
  return (
    <SiteSearchExperience
      applicationId="your-app-id"
      apiKey="your-search-api-key"
      indexName="your-index"
      assistantId="your-assistant-id"
      placeholder="What are you looking for?"
      hitsPerPage={8}
      keyboardShortcut="cmd+k"
    />
  );
}`)}>
                    Copy
                  </button>
                </div>
                <pre><code>{`import { SiteSearchExperience } from './components/sitesearch';
import './sitesearch.css';

function App() {
  return (
    <SiteSearchExperience
      applicationId="your-app-id"
      apiKey="your-search-api-key"
      indexName="your-index"
      assistantId="your-assistant-id"
      placeholder="What are you looking for?"
      hitsPerPage={8}
      keyboardShortcut="cmd+k"
    />
  );
}`}</code></pre>
              </div>
            </div>

            <div className="usage-step">
              <h3>3. Or Copy Individual Components</h3>
              <p>Want more control? Copy and customize individual components from our source:</p>
              <div className="component-grid">
                <div className="component-card">
                  <h4>SearchModal</h4>
                  <p>The main modal container with backdrop and accessibility</p>
                  <code className="file-path">packages/search-react/src/experiences/sitesearch/search-modal.tsx</code>
                </div>
                <div className="component-card">
                  <h4>SearchInput</h4>
                  <p>Enhanced input with AI chat toggle and keyboard navigation</p>
                  <code className="file-path">packages/search-react/src/experiences/sitesearch/search-input.tsx</code>
                </div>
                <div className="component-card">
                  <h4>HitsList</h4>
                  <p>Results display with highlighting and selection states</p>
                  <code className="file-path">packages/search-react/src/experiences/sitesearch/hits-list.tsx</code>
                </div>
                <div className="component-card">
                  <h4>ChatWidget</h4>
                  <p>AI-powered conversational search interface</p>
                  <code className="file-path">packages/search-react/src/experiences/sitesearch/chat.tsx</code>
                </div>
              </div>
            </div>

            <div className="usage-step">
              <h3>4. Customize with CSS</h3>
              <p>All components use CSS custom properties for easy theming:</p>
              <div className="code-block">
                <div className="code-header">
                  <span>styles.css</span>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(`:root {
  --qs-primary-color: #003dff;
  --qs-background: #ffffff;
  --qs-border-radius: 12px;
  --qs-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  --qs-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}`)}>
                    Copy
                  </button>
                </div>
                <pre><code>{`:root {
  --qs-primary-color: #003dff;
  --qs-background: #ffffff;
  --qs-border-radius: 12px;
  --qs-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  --qs-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}`}</code></pre>
              </div>
            </div>

            <div className="usage-step">
              <h3>Usage with other frameworks</h3>
              <p>Want more control? Copy and customize individual components from our source: Vanilla JavaScript, Vue, Angular, Svelte, etc.</p>
              <div className="code-block">
                <div className="code-header">
                  <span>Terminal</span>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(`npm run build:js-bundle`)}>
                    Copy
                  </button>
                </div>
                <pre><code>{`npm run build:js-bundle`}</code></pre>
              </div>
              <div>
                <p>Then use the bundle in your project. </p>
              </div>
            </div>
          </section>

        </main >
      </div >

      <footer className="footer">
        <p>
          Built with ❤️ by the Algolia team.
          <a href="https://github.com/algolia/sitesearch" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div >
  );
}

const AlgoliaLogo = ({
  size = 150,
}: {
  size?: number;
}) => (
  <svg
    width={size}
    aria-label="Algolia"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 2196.2 500"
    style={{ maxWidth: size }}
  >
    <defs>
      <style>{`.cls-1,.cls-2{fill:#fff}.cls-2{fill-rule:evenodd}`}</style>
    </defs>
    <path
      className="cls-2"
      d="M1070.38,275.3V5.91c0-3.63-3.24-6.39-6.82-5.83l-50.46,7.94c-2.87,.45-4.99,2.93-4.99,5.84l.17,273.22c0,12.92,0,92.7,95.97,95.49,3.33,.1,6.09-2.58,6.09-5.91v-40.78c0-2.96-2.19-5.51-5.12-5.84-34.85-4.01-34.85-47.57-34.85-54.72Z"
    />
    <rect
      className="cls-1"
      x="1845.88"
      y="104.73"
      width="62.58"
      height="277.9"
      rx="5.9"
      ry="5.9"
    />
    <path
      className="cls-2"
      d="M1851.78,71.38h50.77c3.26,0,5.9-2.64,5.9-5.9V5.9c0-3.62-3.24-6.39-6.82-5.83l-50.77,7.95c-2.87,.45-4.99,2.92-4.99,5.83v51.62c0,3.26,2.64,5.9,5.9,5.9Z"
    />
    <path
      className="cls-2"
      d="M1764.03,275.3V5.91c0-3.63-3.24-6.39-6.82-5.83l-50.46,7.94c-2.87,.45-4.99,2.93-4.99,5.84l.17,273.22c0,12.92,0,92.7,95.97,95.49,3.33,.1,6.09-2.58,6.09-5.91v-40.78c0-2.96-2.19-5.51-5.12-5.84-34.85-4.01-34.85-47.57-34.85-54.72Z"
    />
    <path
      className="cls-2"
      d="M1631.95,142.72c-11.14-12.25-24.83-21.65-40.78-28.31-15.92-6.53-33.26-9.85-52.07-9.85-18.78,0-36.15,3.17-51.92,9.85-15.59,6.66-29.29,16.05-40.76,28.31-11.47,12.23-20.38,26.87-26.76,44.03-6.38,17.17-9.24,37.37-9.24,58.36,0,20.99,3.19,36.87,9.55,54.21,6.38,17.32,15.14,32.11,26.45,44.36,11.29,12.23,24.83,21.62,40.6,28.46,15.77,6.83,40.12,10.33,52.4,10.48,12.25,0,36.78-3.82,52.7-10.48,15.92-6.68,29.46-16.23,40.78-28.46,11.29-12.25,20.05-27.04,26.25-44.36,6.22-17.34,9.24-33.22,9.24-54.21,0-20.99-3.34-41.19-10.03-58.36-6.38-17.17-15.14-31.8-26.43-44.03Zm-44.43,163.75c-11.47,15.75-27.56,23.7-48.09,23.7-20.55,0-36.63-7.8-48.1-23.7-11.47-15.75-17.21-34.01-17.21-61.2,0-26.89,5.59-49.14,17.06-64.87,11.45-15.75,27.54-23.52,48.07-23.52,20.55,0,36.63,7.78,48.09,23.52,11.47,15.57,17.36,37.98,17.36,64.87,0,27.19-5.72,45.3-17.19,61.2Z"
    />
    <path
      className="cls-2"
      d="M894.42,104.73h-49.33c-48.36,0-90.91,25.48-115.75,64.1-14.52,22.58-22.99,49.63-22.99,78.73,0,44.89,20.13,84.92,51.59,111.1,2.93,2.6,6.05,4.98,9.31,7.14,12.86,8.49,28.11,13.47,44.52,13.47,1.23,0,2.46-.03,3.68-.09,.36-.02,.71-.05,1.07-.07,.87-.05,1.75-.11,2.62-.2,.34-.03,.68-.08,1.02-.12,.91-.1,1.82-.21,2.73-.34,.21-.03,.42-.07,.63-.1,32.89-5.07,61.56-30.82,70.9-62.81v57.83c0,3.26,2.64,5.9,5.9,5.9h50.42c3.26,0,5.9-2.64,5.9-5.9V110.63c0-3.26-2.64-5.9-5.9-5.9h-56.32Zm0,206.92c-12.2,10.16-27.97,13.98-44.84,15.12-.16,.01-.33,.03-.49,.04-1.12,.07-2.24,.1-3.36,.1-42.24,0-77.12-35.89-77.12-79.37,0-10.25,1.96-20.01,5.42-28.98,11.22-29.12,38.77-49.74,71.06-49.74h49.33v142.83Z"
    />
    <path
      className="cls-2"
      d="M2133.97,104.73h-49.33c-48.36,0-90.91,25.48-115.75,64.1-14.52,22.58-22.99,49.63-22.99,78.73,0,44.89,20.13,84.92,51.59,111.1,2.93,2.6,6.05,4.98,9.31,7.14,12.86,8.49,28.11,13.47,44.52,13.47,1.23,0,2.46-.03,3.68-.09,.36-.02,.71-.05,1.07-.07,.87-.05,1.75-.11,2.62-.2,.34-.03,.68-.08,1.02-.12,.91-.1,1.82-.21,2.73-.34,.21-.03,.42-.07,.63-.1,32.89-5.07,61.56-30.82,70.9-62.81v57.83c0,3.26,2.64,5.9,5.9,5.9h50.42c3.26,0,5.9-2.64,5.9-5.9V110.63c0-3.26-2.64-5.9-5.9-5.9h-56.32Zm0,206.92c-12.2,10.16-27.97,13.98-44.84,15.12-.16,.01-.33,.03-.49,.04-1.12,.07-2.24,.1-3.36,.1-42.24,0-77.12-35.89-77.12-79.37,0-10.25,1.96-20.01,5.42-28.98,11.22-29.12,38.77-49.74,71.06-49.74h49.33v142.83Z"
    />
    <path
      className="cls-2"
      d="M1314.05,104.73h-49.33c-48.36,0-90.91,25.48-115.75,64.1-11.79,18.34-19.6,39.64-22.11,62.59-.58,5.3-.88,10.68-.88,16.14s.31,11.15,.93,16.59c4.28,38.09,23.14,71.61,50.66,94.52,2.93,2.6,6.05,4.98,9.31,7.14,12.86,8.49,28.11,13.47,44.52,13.47h0c17.99,0,34.61-5.93,48.16-15.97,16.29-11.58,28.88-28.54,34.48-47.75v50.26h-.11v11.08c0,21.84-5.71,38.27-17.34,49.36-11.61,11.08-31.04,16.63-58.25,16.63-11.12,0-28.79-.59-46.6-2.41-2.83-.29-5.46,1.5-6.27,4.22l-12.78,43.11c-1.02,3.46,1.27,7.02,4.83,7.53,21.52,3.08,42.52,4.68,54.65,4.68,48.91,0,85.16-10.75,108.89-32.21,21.48-19.41,33.15-48.89,35.2-88.52V110.63c0-3.26-2.64-5.9-5.9-5.9h-56.32Zm0,64.1s.65,139.13,0,143.36c-12.08,9.77-27.11,13.59-43.49,14.7-.16,.01-.33,.03-.49,.04-1.12,.07-2.24,.1-3.36,.1-1.32,0-2.63-.03-3.94-.1-40.41-2.11-74.52-37.26-74.52-79.38,0-10.25,1.96-20.01,5.42-28.98,11.22-29.12,38.77-49.74,71.06-49.74h49.33Z"
    />
    <path
      className="cls-1"
      d="M249.83,0C113.3,0,2,110.09,.03,246.16c-2,138.19,110.12,252.7,248.33,253.5,42.68,.25,83.79-10.19,120.3-30.03,3.56-1.93,4.11-6.83,1.08-9.51l-23.38-20.72c-4.75-4.21-11.51-5.4-17.36-2.92-25.48,10.84-53.17,16.38-81.71,16.03-111.68-1.37-201.91-94.29-200.13-205.96,1.76-110.26,92-199.41,202.67-199.41h202.69V407.41l-115-102.18c-3.72-3.31-9.42-2.66-12.42,1.31-18.46,24.44-48.53,39.64-81.93,37.34-46.33-3.2-83.87-40.5-87.34-86.81-4.15-55.24,39.63-101.52,94-101.52,49.18,0,89.68,37.85,93.91,85.95,.38,4.28,2.31,8.27,5.52,11.12l29.95,26.55c3.4,3.01,8.79,1.17,9.63-3.3,2.16-11.55,2.92-23.58,2.07-35.92-4.82-70.34-61.8-126.93-132.17-131.26-80.68-4.97-148.13,58.14-150.27,137.25-2.09,77.1,61.08,143.56,138.19,145.26,32.19,.71,62.03-9.41,86.14-26.95l150.26,133.2c6.44,5.71,16.61,1.14,16.61-7.47V9.48C499.66,4.25,495.42,0,490.18,0H249.83Z"
    />
  </svg>
);

export default App;