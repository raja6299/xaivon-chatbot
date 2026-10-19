# XAIVON Chatbot — Website Embed Handoff Specification

**Document Purpose:** Architectural contract and integration handoff for embedding `assistant.xaivon.com` into the main XAIVON marketing website (`xaivon.com`).
**Status:** **SPECIFICATION ONLY — NO WEBSITE REPO MODIFICATIONS**
**Chatbot Implementation Target:** `https://assistant.xaivon.com/embed`
**Host Target:** `https://xaivon.com`
**Date:** October 19, 2026

---

> [!IMPORTANT]
> **REVISION BOUNDARY / FIREWALL NOTICE:**
> In accordance with the non-negotiable repository firewall, **ZERO** modifications, commits, or deployments have been or will be made to `raja6299/xaivon-website` during this task.
> This document specifies the exact contract that the separate `xaivon-website` engineering task must implement when the chatbot release is approved.

---

## 1. Embed Target & Security Headers

### 1.1 Endpoint
- **URL Path:** `https://assistant.xaivon.com/embed`
- **Fallback URL:** `https://assistant.xaivon.com/` (for browsers blocking cross-site iframes or popups)

### 1.2 Content Security Policy (`frame-ancestors`)
The chatbot deployment returns the following CSP header:
```http
Content-Security-Policy: frame-ancestors 'self' https://xaivon.com https://www.xaivon.com;
```
*Note for Local / Staging Testing:* If testing from staging domains (e.g., `https://xaivon-website.vercel.app`), configure the environment variable `ALLOWED_FRAME_ANCESTORS="https://xaivon-website.vercel.app"` in the chatbot Vercel deployment.

---

## 2. Cross-Window Communication Protocol (`postMessage`)

The embedded widget communicates bidirectionally with the host window using strict origin validation.

### 2.1 Outbound Messages (Dispatched from Chatbot Iframe to Host)

| Message Type | Direction | Payload Schema | Host Action |
|---|---|---|---|
| `XAIVON_CHAT_READY` | Iframe -> Host | `{ type: 'XAIVON_CHAT_READY', version: '1.0.0' }` | Host removes skeleton/loading spinner and reveals the iframe viewport. |
| `XAIVON_CHAT_CLOSE` | Iframe -> Host | `{ type: 'XAIVON_CHAT_CLOSE' }` | Host collapses the floating iframe container and focuses the launcher button. |

**Strict Origin Filter in Chatbot:** The iframe will ONLY send messages to target origins in:
`['https://xaivon.com', 'https://www.xaivon.com', 'http://localhost:3000']` (or `window.location.origin`).

---

### 2.2 Inbound Messages (Received by Chatbot Iframe from Host)

| Message Type | Direction | Payload Schema | Chatbot Behavior |
|---|---|---|---|
| `XAIVON_THEME_CHANGE` | Host -> Iframe | `{ type: 'XAIVON_THEME_CHANGE', theme: 'light' \| 'dark' }` | Syncs the chatbot theme with the parent website's active theme. |
| `XAIVON_OPEN_WITH_PROMPT` | Host -> Iframe | `{ type: 'XAIVON_OPEN_WITH_PROMPT', prompt: string }` | Opens the chat interface and automatically populates/sends the specified consultation prompt. |

---

## 3. Recommended Website Embed Implementation Snippet

When integrating on the `xaivon-website` repository in a future task, implement the host widget as follows:

```html
<!-- Host Container on xaivon.com -->
<div id="xaivon-chat-container" class="xaivon-widget-dock" style="display: none; position: fixed; bottom: 24px; right: 24px; width: 420px; height: 680px; max-width: calc(100vw - 32px); max-height: calc(100vh - 48px); z-index: 999999; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.25);">
  <iframe
    id="xaivon-chat-iframe"
    src="https://assistant.xaivon.com/embed"
    title="XAIVON AI Business Consultant"
    allow="clipboard-write; microphone"
    style="width: 100%; height: 100%; border: none;"
  ></iframe>
</div>

<script>
  (function() {
    const ALLOWED_ORIGIN = 'https://assistant.xaivon.com';
    const container = document.getElementById('xaivon-chat-container');

    window.addEventListener('message', function(event) {
      // 1. Strict Origin Validation
      if (event.origin !== ALLOWED_ORIGIN) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // 2. Handle Handshake
      if (data.type === 'XAIVON_CHAT_READY') {
        console.log('[XAIVON Host] Chatbot initialized and ready.');
      }

      // 3. Handle Close Request
      if (data.type === 'XAIVON_CHAT_CLOSE') {
        container.style.display = 'none';
        const trigger = document.getElementById('xaivon-chat-launcher');
        if (trigger) trigger.focus();
      }
    });
  })();
</script>
```

---

## 4. Host Verification Checklist for Future Website PR

When executing the website integration task later:
- [ ] Verify host origin is strictly `https://xaivon.com` or `https://www.xaivon.com`.
- [ ] Confirm CSP `child-src` or `frame-src` on `xaivon.com` allows `https://assistant.xaivon.com`.
- [ ] Confirm iframe permissions include `allow="clipboard-write; microphone"`.
- [ ] Test mobile viewport resize: on screens under 600px width, ensure host container expands to full viewport (`width: 100vw; height: 100vh; bottom: 0; right: 0; border-radius: 0;`).
- [ ] Test keyboard escape handling: pressing Escape when inside the chat should dispatch `XAIVON_CHAT_CLOSE` and return focus to host trigger.
