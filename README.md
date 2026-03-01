# SendFile

**Browser-to-browser file transfer — encrypted end-to-end, no sign-up, nothing stored on a server.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-brightgreen)](https://github.com/praveen-kumar-rr/send-file)

---

## What is it?

SendFile is an open source, serverless P2P file sharing web app. Files travel directly between browsers using **WebRTC DataChannels** — your files never touch a server. Everything is encrypted end-to-end with **AES-256** via the Web Crypto API before leaving your device.

---

## How it works

1. **Sender** opens the app and gets a unique room key.
2. **Sender** shares the room key (or the auto-generated share link) with the recipient.
3. **Receiver** enters the room key and clicks Connect.
4. A direct WebRTC peer connection is established — files are chunked, encrypted, and streamed straight to the receiver's browser.
5. Receiver downloads the reassembled file locally.

No accounts. No cloud storage. No file size limits imposed by the service.

---

## Technology

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| UI framework  | React 18 + TypeScript                                 |
| Styling       | Tailwind CSS v3                                       |
| Bundler       | Vite 5                                                |
| P2P transport | WebRTC DataChannels via [PeerJS](https://peerjs.com/) |
| Encryption    | Web Crypto API — AES-256-GCM                          |
| Icons         | Lucide React                                          |
| Deployment    | GitHub Pages (served from `docs/` on `main` branch)   |

---

## Getting started

### Prerequisites

- Node.js ≥ 22
- npm ≥ 10

### Run locally

```bash
git clone https://github.com/praveen-kumar-rr/send-file.git
cd send-file
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in two browser tabs (or two devices on the same network) to test a transfer.

### Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

### Deploy to GitHub Pages

```bash
npm run build:gh-pages
```

This builds the app with the `/send-file/` base path and outputs to the `docs/` folder. Commit and push the updated `docs/` folder to the `main` branch. GitHub Pages is configured to serve from `docs/` on `main`.

---

## Project structure

```
src/
├── App.tsx                  # Root — screen routing & state wiring
├── index.css                # Global styles & Tailwind component layer
├── types.ts                 # Shared TypeScript types
├── components/
│   ├── LandingScreen.tsx    # Hero / home screen
│   ├── SenderScreen.tsx     # Send files UI
│   ├── ReceiverScreen.tsx   # Receive files UI
│   ├── Navbar.tsx           # Top navigation bar
│   └── Toast.tsx            # Toast notification system
├── context/
│   └── ThemeContext.tsx     # Light / dark / system theme
├── hooks/
│   ├── useSender.ts         # Sender WebRTC logic & state
│   └── useReceiver.ts       # Receiver WebRTC logic & state
└── utils/
    ├── crypto.ts            # AES-256-GCM encrypt / decrypt helpers
    └── helpers.ts           # File icons, byte formatting, etc.
```

---

## Contributing

Contributions are welcome! Here's how to get started:

Please keep PRs focused — one feature or fix per PR. For larger changes, open an issue first to discuss the approach.

---

## Disclaimer

This service facilitates direct P2P file transfers within your browser. Files are never stored or accessed by any server. We are not responsible for the nature, legality, or accuracy of any files shared. Use responsibly and in compliance with applicable laws.

---

## License

[MIT](LICENSE) © Praveen Kumar
