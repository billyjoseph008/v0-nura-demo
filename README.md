# Nura Starter

A professional, interactive demo application showcasing all core features of the **Nura** voice/intent recognition framework.

## Features

- **Voice Recognition**: Web Speech API integration with multi-language support (ES/EN/es-419)
- **Wake Word Detection**: Phonetic matching for "ok nura" and aliases
- **Fuzzy Intent Matching**: Multiple strategies (Damerau, Soundex, Double Metaphone, Hybrid)
- **Context Confirmations**: Follow-up commands like "sí, elimínala"
- **Numeral Extraction**: Convert spoken numbers to digits in Spanish and English
- **i18n Support**: Auto-detect or force locale
- **MCP Integration**: Connect to Model Context Protocol gateway
- **Telemetry**: Real-time event streaming and intent ranking
- **Explain Mode**: Debug intent matching without executing actions
- **Accessibility**: Keyboard-first, ARIA labels, high contrast

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run E2E tests
pnpm e2e

# Build for production
pnpm build
\`\`\`

## Usage

1. **Type or speak commands** in the Command Console
2. **Adjust settings**: threshold, strategy, locale, explain mode
3. **Try quick examples** to see different features
4. **View telemetry** to understand intent matching
5. **Connect to MCP** (optional) for external tool integration

## Example Commands

- `ok nura abre el menú de órdenes` - Open orders menu (ES)
- `ok nora abre el menú de órdenes` - Phonetic wake word
- `ok nura borra la orden quince` - Delete order 15 (numeral extraction)
- `ok nura open orders menu` - Open orders menu (EN)
- `abre el menú de pedidos` - Synonym matching (no wake word)
- `elimina la orden 15` → `sí, elimínala` - Context confirmation
- `ok nura muestra capacidades` - Open the interactive capabilities modal
- `ok nura abre telemetría` - Spotlight telemetry card & modal
- `ok nura activa modo explain` / `ok nura desactiva explain` - Toggle explain mode
- `ok nora conectar mcp` / `ok nura list resources` / `ok nura list tools` - Drive MCP integration
- `sí, confírmalo` - Approve the last destructive action

## Keyboard Shortcuts

- `?` - Open the capabilities/help modal
- `t` - Toggle telemetry modal highlight
- `e` - Toggle explain mode on/off

## Architecture

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **Mock Nura implementation** (replace with real `@nura/*` packages)
- **Playwright** E2E tests
- **SWR** for client state management

## About Nura

Nura was created by **Billy Joseph Rojas Vindas** (Costa Rica), inspired by a trip to the **Republic of Tatarstan (Russia)**. The name blends *nur* (ray of light, in Tatar) and *pneuma* (breath). Nura focuses on ergonomic agent ↔ UI interactions.

## License

MIT
