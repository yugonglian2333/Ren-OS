const list = document.querySelector("#books");
const count = document.querySelector("#count");
const allButton = document.querySelector("#all");
const readingButton = document.querySelector("#reading");
const fixed = document.querySelector("#fixed");
const stateLabel = { reading: "在读", finished: "读完" };

function selectBooks(books, view) {
  if (view === "all") return books;
  if (fixed.checked) return books.filter(book => book.state === view);
  return books.filter(book => book.status === view);
}

async function loadShelf(view) {
  allButton.disabled = readingButton.disabled = true;
  allButton.setAttribute("aria-pressed", String(view === "all"));
  readingButton.setAttribute("aria-pressed", String(view === "reading"));
  count.textContent = "正在取书目…";
  list.replaceChildren();
  try {
    const response = await fetch("/labs/reading-shelf/books.json", { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const books = await response.json();
    const visible = selectBooks(books, view);
    for (const book of visible) {
      const row = document.createElement("li");
      row.textContent = book.title + " · " + stateLabel[book.state];
      list.append(row);
    }
    count.textContent = view === "all" ? "全部 · " + visible.length + " 本" : "在读 · " + visible.length + " 本";
  } catch (error) {
    count.textContent = "书目加载失败（" + error.message + "），请重试";
  } finally {
    allButton.disabled = readingButton.disabled = false;
  }
}

allButton.addEventListener("click", () => loadShelf("all"));
readingButton.addEventListener("click", () => loadShelf("reading"));
