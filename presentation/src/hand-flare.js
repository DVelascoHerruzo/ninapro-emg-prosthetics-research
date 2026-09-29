const POSES = ["pose-open", "pose-fist", "pose-point", "pose-pinch", "pose-thumbsup"];

// Purely decorative: a CSS hand icon that changes pose as the audience moves through slides,
// echoing the EMG-to-movement theme of the deck. Not a biomechanical model.
export function mountHandFlare(deck) {
  const container = document.createElement("div");
  container.className = "hand-flare pose-open";
  container.innerHTML = `
    <div class="hand-palm"></div>
    <div class="hand-finger hand-thumb"></div>
    <div class="hand-finger hand-index"></div>
    <div class="hand-finger hand-middle"></div>
    <div class="hand-finger hand-ring"></div>
    <div class="hand-finger hand-little"></div>`;
  document.body.appendChild(container);

  const setPose = (index) => {
    const pose = POSES[((index % POSES.length) + POSES.length) % POSES.length];
    container.className = `hand-flare ${pose}`;
  };
  setPose(0);
  deck.on("slidechanged", (event) => setPose(event.indexh + event.indexv));
}
