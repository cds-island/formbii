<img width="259" height="86" alt="image" src="https://github.com/user-attachments/assets/e2358184-cd51-4255-95a8-5c081d5a379e" />



**FormBii**  is a lightweight, browser-based character customization tool inspired by console-style avatar editors like Mii Maker.

It provides a modular, layer-based system for building stylized characters using selectable visual assets and a simple navigation-driven UI.

---

## Overview

This project is designed to replicate the feel of a console avatar editor inside the browser.

Instead of freeform drawing, characters are built by selecting from predefined asset sets (hair, eyes, mouth, etc.). Each selection updates a specific visual layer in real time.

The system is intentionally lightweight, making it easy to extend, modify, or embed into other projects.

---

## Features

- Console-style avatar editor UI  
- Layer-based character rendering system  
- Category-based customization (hair, eyes, face, etc.)  
- Real-time preview updates  
- Button-driven navigation (no complex menus)  
- Optional keyboard navigation support  
- Asset-based customization system (swap images per feature)  
- Fully client-side (HTML/CSS/JS only)  
- Easy to expand with new parts and categories  

---

## The Editor System

The editor is built around a **layer stack model**.

Each character is composed of multiple independent layers:

- Base head/body layer  
- Hair layer  
- Eyes layer  
- Mouth layer  
- Optional accessories layer  

When a user changes a feature:
- Only that specific layer is replaced  
- Other layers remain unchanged  
- The final character is re-rendered instantly in the browser  

This makes the system fast, modular, and easy to expand.

---

## Character Categories

Typical categories include:

- Hair styles  
- Eye styles  
- Mouth expressions  
- Skin tones (optional)  
- Accessories (glasses, hats, etc.)  

Each category pulls from a defined asset list stored in the project.

---

## Asset System

All visual components are stored as individual image files inside the `assets/` folder.

Example structure:

assets/
├── hair/
├── eyes/
├── mouth/
└── accessories/

Each category is mapped in `script.js`, allowing easy expansion by adding new image files without changing core logic.

---

## How It Works

1. The base character is loaded in `index.html`  
2. Each feature category is defined in JavaScript  
3. When a user selects an option:
   - The corresponding image layer is updated  
4. Layers are stacked using CSS positioning  
5. The result is a fully composed character preview  

---

## Project Structure

charactercreator/
├── index.html      # Main UI structure
├── style.css       # Layout + layering system
├── script.js       # Editor logic + state handling
├── assets/         # Character part images
└── README.md

---

## Customization

You can extend the editor by:

- Adding new asset categories (e.g. hats, eyebrows, outfits)  
- Expanding existing categories with more options  
- Adjusting layer order in CSS  
- Modifying navigation behavior in JavaScript  
- Changing UI layout or styling  
- Adding randomizer / shuffle character feature  

---

## Planned Features

- Digipog Support
- Random character generator  
- Drag-and-drop asset support  
- Animated transitions between selections  
- Mobile touch controls  
- More advanced layering (opacity, blending, etc.)  

---

## Contributing

Contributions are welcome.

1. Fork the repository  
2. Create a feature branch  
3. Make your changes  
4. Submit a pull request  

Please keep the project lightweight and consistent with the existing editor structure.

---

## License

MIT License

---

## Acknowledgements

Inspired by console avatar editors such as Mii Maker and similar character creation systems.

Built as a modular experiment in browser-based character customization.
