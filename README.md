# Writing Spark ✨

A simple writing helper for children in grades 2–4. Type a Chinese character or compound word to get an idea for what to write about, then write your own sentence on paper. English story mode also offers thinking cues when a story gets stuck.

For example, **雨** can suggest **下雨 (rain)** and “Write about walking to school on a rainy morning.” The app supplies a starting situation and a word you could use, leaving the sentence to the child.

The built-in collection has 492 ideas across 164 word entries, covering 255 characters including explicit simplified and traditional forms. It is a starter collection of everyday vocabulary, not a complete HSK or Better Immersion curriculum. Unsupported characters or words get a clear message, and **Characters and words with ideas** shows the available inputs. Compound words match as a whole; the app does not substitute ideas for their individual characters. All ideas are local: no AI service, API key, account, or usage costs. Your input is not sent to a service or saved.

## Features

*   **Two Modes:**
    *   **Chinese Sentence Ideas:** Enter a character or a whole word, such as 学校, 朋友, or 好朋友, with a Chinese keyboard. A single character can suggest a word containing it; a compound gets ideas for that exact word. Each supported input has at least three ideas.
    *   **English Story Helper:** Thinking cues to keep a child's own story moving.
*   **Visual "Time Timer":** A red disk that shrinks clockwise as time passes, providing a concrete, non-digital sense of remaining time.
*   **Side-by-Side Layout:** Optimized for landscape iPads and Chromebooks to keep prompts and timers clearly separated.
*   **Ultra-Dim Zen Mode (🌙):** A one-tap "blanking" mode that turns the screen black, showing only a very faint, ghostly red timer wedge to minimize computer distraction while writing.
*   **Looping Timer:** The chime is a reminder to try another suggestion if the current one has not helped. The timer repeats; the current card stays in place until the child requests another.
*   **Fresh Ideas:** Each character or word has its own shuffled deck. Every idea is shown before that deck repeats, with no immediate repeat. Switching inputs or modes preserves progress until the page reloads. When several words contain a character, suggestions vary between those words when possible.
*   **English Thinking Cues:** 40 cues across eight strategies: association, memory, people, imagination, senses, details, structure, and speaking. Each new cue uses a different strategy whenever one remains.
*   **Accessible Controls:** Keyboard controls, zoom support, reduced-motion support, and a sound toggle.

## How to Use

1.  **Open the App:** Visit the webpage on an iPad, Chromebook, or Phone.
2.  **Select Mode:** Choose "Chinese Sentence" or "English Story".
3.  **Set Timer:** While paused, click the timer numbers or clock face and choose how long to try a suggestion, from 1 to 10 minutes (default is 5). The circle always represents 10 minutes, so a five-minute timer starts half full.
4.  **Get an Idea:** In Chinese mode, type a Chinese character or word, then tap **“✨ Give me an idea”** or press Enter after choosing your keyboard’s characters. English mode needs no character input. Each new idea resets and starts the timer.
5.  **Try It:** Use the suggestion to write your own sentence. Still stuck when the timer rings? Tap **“✨ Try another idea.”** Already writing? Keep going. You can also request another suggestion before the timer rings. Edit the character or word to start a different assignment.
6.  **Quiet Screen:** Tap the **Moon (🌙)** icon to dim the screen while trying an idea or writing on paper. Tap anywhere or press Escape to return.
7.  **Sound:** Use **Sound on / Sound off** to mute or enable the repeating chime.

The countdown uses elapsed time, including time spent in another tab. When the browser resumes after a delay, the timer catches up to the current round and plays at most one chime. Browsers may suspend background pages, so sound at the exact deadline is only possible while the page is running.

To use the app entirely offline, download `index.html`, `prompts.js`, and `character-ideas.js` into the same folder and open `index.html` in a browser. The hosted page requires a connection to load initially; it does not install an offline cache.

## Checks

With Node.js installed, run `node --test tests/app.test.cjs` for character and compound-word matching, input validation, composition handling, deck selection, timer, and audio regression checks. No dependencies or build step are required.

## Deployment

This project is hosted on **GitHub Pages**. To update:
1.  Edit `character-ideas.js` to add Chinese ideas. Each entry lists `words` (explicit simplified/traditional forms), an English `meaning`, and at least three distinct `ideas`. Each complete word form and every individual character in it becomes searchable. Multi-character inputs match only listed word forms, including their explicit traditional variants. Keep situations short, age-appropriate, and clearly connected to the word. Supply an idea, not a finished sentence. Do not map unrelated characters by their radicals.
2.  Edit `prompts.js` for English cues. Each entry has a `strategy` tag and plain `text`.
3.  Run the checks above.
4.  Push to GitHub. The site updates automatically.

Selection favors strategies with more unused cards, helping preserve variety near the end of the deck. Keep roughly similar numbers of cards in each strategy. If only one strategy remains, its remaining cards are still shown before any card repeats.

## Credits & License

**Copyright © 2026 Anand Mandapati.**

This project was conceptualized by Anand Mandapati and generated with the assistance of **Google Gemini**, an AI coding agent.

Licensed under the [MIT License](LICENSE).
