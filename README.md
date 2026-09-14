# Writing Spark ✨

A distraction-free "Oblique Strategies" tool for children in grades 2–4. It offers ways to think when a child gets stuck on a Chinese sentence or English story, leaving the ideas and wording to the child. Writing happens on paper.

The app does not ask for the assigned Chinese character or use a curriculum database. Its suggestions apply across assignments: recall a memory, make a connection, imagine a change, notice a detail, or try saying an idea aloud. A suggestion is optional; it is fine to skip one that does not fit.

## Features

*   **Two Modes:**
    *   **Chinese Sentence Expander:** Thinking cues to find an idea for an assigned character and add detail to a sentence, including assignments with 15+ character requirements.
    *   **English Story Helper:** Thinking cues to keep a child's own story moving.
*   **Visual "Time Timer":** A red disk that shrinks clockwise as time passes, providing a concrete, non-digital sense of remaining time.
*   **Side-by-Side Layout:** Optimized for landscape iPads and Chromebooks to keep prompts and timers clearly separated.
*   **Ultra-Dim Zen Mode (🌙):** A one-tap "blanking" mode that turns the screen black, showing only a very faint, ghostly red timer wedge to minimize computer distraction while writing.
*   **Looping Timer:** The chime is a reminder to try another suggestion if the current one has not helped. The timer repeats; the current card stays in place until the child requests another.
*   **Varied Approaches:** Each mode has 40 cues across eight strategies: association, memory, people, imagination, senses, details, structure, and speaking. Each new card uses a different strategy whenever one remains, and every card is shown before the deck repeats. Categories stay behind the scenes.
*   **Accessible Controls:** Keyboard controls, zoom support, reduced-motion support, and a sound toggle.

## How to Use

1.  **Open the App:** Visit the webpage on an iPad, Chromebook, or Phone.
2.  **Select Mode:** Choose "Chinese Sentence" or "English Story".
3.  **Set Timer:** While paused, click the timer numbers or clock face and choose how long to try a suggestion, from 1 to 10 minutes (default is 5). The circle always represents 10 minutes, so a five-minute timer starts half full.
4.  **Get an Idea:** Tap the big **"✨ Give me an Idea"** button whenever stuck. Each new idea resets and starts the timer.
5.  **Try It:** Use the suggestion if it helps. Still stuck when the timer rings? Tap for another. Already writing? Keep going. You can also request another suggestion before the timer rings.
6.  **Quiet Screen:** Tap the **Moon (🌙)** icon to dim the screen while trying an idea or writing on paper. Tap anywhere or press Escape to return.
7.  **Sound:** Use **Sound on / Sound off** to mute or enable the repeating chime.

The countdown uses elapsed time, including time spent in another tab. When the browser resumes after a delay, the timer catches up to the current round and plays at most one chime. Browsers may suspend background pages, so sound at the exact deadline is only possible while the page is running.

## Checks

With Node.js installed, run `node --test tests/app.test.cjs` for timer, audio, and prompt-selection regression checks. No dependencies or build step are required.

## Deployment

This project is hosted on **GitHub Pages**. To update:
1.  Edit `prompts.js` to revise or add cards. Each entry has a `strategy` tag and plain `text`. Keep cues short, optional, and open enough for the child to supply their own content.
2.  Push to GitHub. The site updates automatically.

Selection favors strategies with more unused cards, helping preserve variety near the end of the deck. Keep roughly similar numbers of cards in each strategy. If only one strategy remains, its remaining cards are still shown before any card repeats.

## Credits & License

**Copyright © 2026 Anand Mandapati.**

This project was conceptualized by Anand Mandapati and generated with the assistance of **Google Gemini**, an AI coding agent.

Licensed under the [MIT License](LICENSE).
