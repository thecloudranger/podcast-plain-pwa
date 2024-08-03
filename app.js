document.addEventListener("DOMContentLoaded", () => {
  // Load RSS feeds from JSON file
  fetch("rss-feeds.json")
    .then((response) => response.json())
    .then((feeds) => {
      const rssFeedList = document.getElementById("rss-feed-list");
      feeds.forEach((feed) => {
        fetch(feed.url)
          .then((response) => response.text())
          .then((str) =>
            new window.DOMParser().parseFromString(str, "text/xml")
          )
          .then((data) => {
            const channel = data.querySelector("channel");
            let imageUrl = "";
            if (channel) {
              const imageElement =
                channel.querySelector("image url") ||
                channel.querySelector("itunes\\:image") ||
                channel.querySelector("image");
              if (imageElement) {
                imageUrl =
                  imageElement.textContent || imageElement.getAttribute("href");
              }
            }
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                            <img src="${imageUrl}" alt="${feed.title}">
                            <p>${feed.title}</p>
                        `;
            listItem.addEventListener("click", () => {
              loadEpisodes(feed.url);
              document
                .querySelectorAll("#rss-feed-list li")
                .forEach((li) => li.classList.remove("active"));
              listItem.classList.add("active");
            });
            rssFeedList.appendChild(listItem);
          })
          .catch((error) => {
            console.error("Error fetching or parsing RSS feed:", error);
          });
      });
    });

  function loadEpisodes(rssUrl) {
    fetch(rssUrl)
      .then((response) => response.text())
      .then((str) => new window.DOMParser().parseFromString(str, "text/xml"))
      .then((data) => {
        const channel = data.querySelector("channel");
        if (channel) {
          const podcastTitle = channel.querySelector("title");
          if (podcastTitle) {
            document.getElementById("podcast-title").innerText =
              podcastTitle.textContent;
          }

          const items = data.querySelectorAll("item");
          const tableBody = document.querySelector("#episodes-table tbody");
          tableBody.innerHTML = ""; // Clear existing episodes
          items.forEach((item) => {
            const title = item.querySelector("title")
              ? item.querySelector("title").textContent
              : "No title";
            const pubDate = item.querySelector("pubDate")
              ? new Date(
                  item.querySelector("pubDate").textContent
                ).toLocaleDateString()
              : "No date";
            const duration = getDuration(item);
            const audioUrl = item.querySelector("enclosure")
              ? item.querySelector("enclosure").getAttribute("url")
              : "";

            const row = document.createElement("tr");
            row.innerHTML = `
                            <td>${title}</td>
                            <td>${pubDate}</td>
                            <td>${duration}</td>
                        `;
            if (audioUrl) {
              row.addEventListener("click", () => openPlayer(title, audioUrl));
            }
            tableBody.appendChild(row);
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching or parsing RSS feed:", error);
      });
  }

  function getDuration(item) {
    const durationTags = [
      "itunes\\:duration",
      "duration",
      "media:content duration",
    ];
    for (const tag of durationTags) {
      const durationElement = item.querySelector(tag);
      if (durationElement) {
        return durationElement.textContent;
      }
    }
    return "No duration";
  }

  function openPlayer(title, audioUrl) {
    document.getElementById("episode-title").innerText = title;
    const audioPlayer = document.getElementById("audio-player");
    audioPlayer.src = audioUrl;
    audioPlayer.currentTime = 0;
    audioPlayer.play();
    document
      .getElementById("audio-player-container")
      .classList.remove("hidden");
  }

  document.getElementById("skip-back").addEventListener("click", () => {
    const audioPlayer = document.getElementById("audio-player");
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
  });

  document.getElementById("skip-forward").addEventListener("click", () => {
    const audioPlayer = document.getElementById("audio-player");
    audioPlayer.currentTime = Math.min(
      audioPlayer.duration,
      audioPlayer.currentTime + 10
    );
  });

  // Register the service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  }
});
