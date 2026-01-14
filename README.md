# Writing Spark ✨

A distraction-free web application designed to help students overcome writer's block in both Chinese and English writing assignments. 

It uses the concept of **"Oblique Strategies"**—providing small, specific constraints or nudges (e.g., "Add a color," "Describe the sound")—to help kids expand sentences and sustain narrative flow without the anxiety of a blank page.

## Features

*   **Chinese Mode:** 
    *   Displays weekly vocabulary characters.
    *   **"Sentence Idea" Button:** Generates generic prompts (Time, Location, Feeling) to help students build longer, 15+ character sentences.
*   **English Mode:**
    *   Displays weekly essay prompts or questions.
    *   **"Writer's Block Helper" Button:** Provides narrative nudges (Transitions, Sensory details, Reflection) to help sustain writing flow.
*   **Distraction-Free:** No ads, no complex menus. Just the task at hand.
*   **Mobile Optimized:** Works perfectly on iPads, Chromebooks, and Tablets in landscape mode.

## How to Update Weekly Content

The app is designed to be "zero-maintenance" during the school week. You only update one file on Sunday night.

1.  Open `data.js`.
2.  Update the `chineseWords` list with the new vocabulary.
3.  Update the `englishPrompts` list with the new writing questions.
4.  Commit and push the file. The site updates automatically.

## Deployment

This project is designed to be hosted on **GitHub Pages**.

1.  Upload the files (`index.html`, `data.js`, `prompts.js`) to a GitHub repository.
2.  Go to **Settings** > **Pages**.
3.  Select the `main` branch as the source.
4.  Your app will be live at `https://[username].github.io/[repo-name]/`.

## Development

*   `index.html`: The main application logic and UI.
*   `data.js`: The dynamic user data (Homework).
*   `prompts.js`: The static database of creative strategies (The "Brain").

## Credits & License

**Copyright © 2026 Anand (anandman).**

This project was conceptualized by Anand and generated with the assistance of **Google Gemini**, an AI coding agent.

Licensed under the [MIT License](LICENSE).