// --- Konfigurasi ---
      const CONTENTFUL_SPACE_ID = "6mexkw3rau5q";
      const CONTENTFUL_ACCESS_TOKEN =
        "Aha_l_pf6YOina8OjVRguekkyHLIQgakyqSKTQnkfHk";
      const BERITA_CONTENT_TYPE_ID = "berita";
      const POTENSI_CONTENT_TYPE_ID = "potensi";
      const contentfulApiUrl = `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE_ID}/environments/master`;
      const BERITA_PER_PAGE = 9;

      // --- Variabel Global ---
      let currentBeritaSkip = 0;
      let totalBeritaAvailable = 0;
      let allBeritaItems = [];
      let allPotensiItems = [];
      let allAssets = [];
      let loadMoreButton,
        loadingMessage,
        endMessage,
        beritaContainer,
        potensiContainer,
        potensiLoadingMessage;

      // --- Fetch Berita ---
      async function fetchBerita(initialLoad = false) {
        if (!beritaContainer && initialLoad) {
          return;
        }
        if (initialLoad && loadingMessage)
          loadingMessage.style.display = "block";
        if (loadMoreButton) loadMoreButton.style.display = "none";
        try {
          const url = `${contentfulApiUrl}/entries?access_token=${CONTENTFUL_ACCESS_TOKEN}&content_type=${BERITA_CONTENT_TYPE_ID}&include=1&limit=${BERITA_PER_PAGE}&skip=${currentBeritaSkip}&order=-sys.createdAt`;
          const response = await fetch(url);
          if (!response.ok) throw new Error("Gagal mengambil data berita");
          const data = await response.json();
          if (initialLoad) {
            totalBeritaAvailable = data.total;
            if (loadingMessage) loadingMessage.style.display = "none";
            if (beritaContainer) beritaContainer.innerHTML = "";
          }
          if (!data.items || data.items.length === 0) {
            if (!initialLoad) {
              if (endMessage) endMessage.style.display = "block";
            } else if (beritaContainer) {
              beritaContainer.innerHTML =
                '<p class="text-center md:col-span-3 text-gray-500">Belum ada berita yang dipublikasikan.</p>';
            }
            if (initialLoad && loadMoreButton)
              loadMoreButton.style.display = "none";
            return;
          }
          allBeritaItems = allBeritaItems.concat(data.items);
          const newAssets = data.includes?.Asset ? data.includes.Asset : [];
          newAssets.forEach((a) => {
            if (!allAssets.some((e) => e.sys.id === a.sys.id)) {
              allAssets.push(a);
            }
          });
          data.items.forEach((item) => {
            const fields = item.fields;
            let imageUrl = "https://via.placeholder.com/400x250.png?text=Foto";
            if (fields.gambar?.sys?.id) {
              const asset = allAssets.find(
                (a) => a.sys.id === fields.gambar.sys.id
              );
              if (asset?.fields?.file?.url) {
                imageUrl = `https:${asset.fields.file.url}?w=400&h=250`;
              }
            } // Hapus fit=cover
            const tgl = fields.tanggal
              ? new Date(fields.tanggal).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "";
            const judul = fields.judul || "Judul";
            const ringkasan = fields.ringkasan || "";
            const card = `<div class="bg-white rounded-lg shadow-lg overflow-hidden group transition-all"><img src="${imageUrl}" alt="${judul}" class="w-full h-48 object-cover bg-gray-200"> <div class="p-6"><p class="text-sm text-red-600 font-semibold mb-2">${tgl}</p><h3 class="text-xl font-semibold text-gray-800 mb-3">${judul}</h3><p class="text-gray-600 text-sm mb-4">${ringkasan}</p><button type="button" class="font-semibold text-red-600 hover:text-red-800 berita-modal-trigger transition-all group-hover:scale-105" data-berita-id="${item.sys.id}">Baca Selengkapnya →</button></div></div>`;
            if (beritaContainer)
              beritaContainer.insertAdjacentHTML("beforeend", card);
          });
          currentBeritaSkip += data.items.length;
          if (currentBeritaSkip < totalBeritaAvailable) {
            if (loadMoreButton) loadMoreButton.style.display = "inline-block";
          } else {
            if (endMessage) endMessage.style.display = "block";
            if (loadMoreButton) loadMoreButton.style.display = "none";
          }
        } catch (error) {
          console.error("Error di fetchBerita:", error);
          if (beritaContainer) {
            beritaContainer.innerHTML =
              '<p class="text-center md:col-span-3 text-red-500">Gagal memuat berita.</p>';
          }
          if (loadingMessage) loadingMessage.style.display = "none";
          if (loadMoreButton) loadMoreButton.style.display = "none";
        }
      }

      // --- Fetch Potensi (Kartu Mirip Berita) ---
      async function fetchPotensi() {
        if (!potensiContainer) {
          return;
        }
        if (potensiLoadingMessage)
          potensiLoadingMessage.style.display = "block";
        try {
          const url = `${contentfulApiUrl}/entries?access_token=${CONTENTFUL_ACCESS_TOKEN}&content_type=${POTENSI_CONTENT_TYPE_ID}&order=sys.createdAt&include=1`;
          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`Gagal ambil potensi (${response.status})`);
          const data = await response.json();
          if (potensiLoadingMessage)
            potensiLoadingMessage.style.display = "none";
          if (!data.items || data.items.length === 0) {
            potensiContainer.innerHTML =
              '<p class="text-center md:col-span-3 text-gray-500">Data potensi belum tersedia.</p>';
            return;
          }

          allPotensiItems = data.items;
          const potensiAssets = data.includes?.Asset ? data.includes.Asset : [];
          potensiAssets.forEach((a) => {
            if (!allAssets.some((e) => e.sys.id === a.sys.id)) {
              allAssets.push(a);
            }
          });

          potensiContainer.innerHTML = "";
          data.items.forEach((item) => {
            const fields = item.fields;
            const judul = fields.judul || "Potensi";
            const desk = fields.deskripsi || "";
            let imageUrl =
              "https://via.placeholder.com/400x250.png?text=Potensi";
            let imageAlt = judul;

            if (fields.icon?.sys?.id) {
              const asset = allAssets.find(
                (a) => a.sys.id === fields.icon.sys.id
              );
              if (asset?.fields?.file?.url) {
                imageUrl = `https:${asset.fields.file.url}?w=400&h=250`; // Hapus fit=cover
                imageAlt = asset.fields.title || judul;
              }
            }

            const deskSingkat =
              desk.length > 100 ? desk.substring(0, 100) + "..." : desk;
            const descFmt = deskSingkat.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-semibold text-gray-800">$1</strong>'
            );

            const card = `
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden group transition-all">
                        <img src="${imageUrl}" alt="${imageAlt}" class="w-full h-48 object-cover bg-gray-200"> 
                        <div class="p-6">
                            <h3 class="text-xl font-semibold text-gray-800 mb-3">${judul}</h3>
                            <p class="text-gray-600 text-sm mb-4">${descFmt}</p>
                            <button type="button" 
                                    class="font-semibold text-red-600 hover:text-red-800 potensi-modal-trigger" 
                                    data-potensi-id="${item.sys.id}">
                                Baca Selengkapnya →
                            </button>
                        </div>
                    </div>`;
            potensiContainer.insertAdjacentHTML("beforeend", card);
          });
        } catch (error) {
          console.error("Error di fetchPotensi:", error);
          if (potensiContainer) {
            potensiContainer.innerHTML = `<p class="text-center md:col-span-3 text-red-500">Gagal memuat potensi: ${error.message}</p>`;
          }
          if (potensiLoadingMessage)
            potensiLoadingMessage.style.display = "none";
        }
      }

      // --- Helper Modal ---
      function openModal(modalEl) {
        if (modalEl) {
          modalEl.classList.remove("hidden");
          setTimeout(() => {
            modalEl
              .querySelector(".modal-content")
              ?.classList.add("opacity-100", "translate-y-0", "scale-100");
          }, 10);
        }
      }
      function closeModal(modalEl) {
        if (modalEl) {
          modalEl
            .querySelector(".modal-content")
            ?.classList.remove("opacity-100", "translate-y-0", "scale-100");
          modalEl.querySelector(".modal-content")?.classList.add("scale-95");
          setTimeout(() => {
            modalEl.classList.add("hidden");
          }, 300);
        }
      }

      // --- DOMContentLoaded ---
      document.addEventListener("DOMContentLoaded", () => {
        loadMoreButton = document.getElementById("load-more-berita");
        loadingMessage = document.getElementById("berita-loading-message");
        endMessage = document.getElementById("berita-end-message");
        beritaContainer = document.getElementById("berita-container");
        potensiContainer = document.getElementById("potensi-container");
        potensiLoadingMessage = document.getElementById(
          "potensi-loading-message"
        );
        const mobileMenuButton = document.getElementById("mobile-menu-button");
        const mobileMenu = document.getElementById("mobile-menu");
        fetchBerita(true);
        fetchPotensi();
        if (loadMoreButton) {
          loadMoreButton.addEventListener("click", () => fetchBerita(false));
        }
        if (mobileMenuButton && mobileMenu) {
          mobileMenuButton.addEventListener("click", (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle("hidden");
          });
        }

        // Central Click Handler
        document.body.addEventListener("click", function (e) {
          const navLink = e.target.closest("a.nav-link");
          const staticModalTrigger = e.target.closest("[data-modal-target]");
          const beritaModalTrigger = e.target.closest(".berita-modal-trigger");
          const potensiModalTrigger = e.target.closest(
            ".potensi-modal-trigger"
          );
          const mapImageTrigger = e.target.closest("#map-image-trigger");
          const modalCloseButton = e.target.closest(".modal-close");
          const modalBackdrop = e.target.classList.contains("modal-backdrop")
            ? e.target
            : null;

          if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
            if (
              (!mobileMenu.contains(e.target) &&
                !mobileMenuButton.contains(e.target)) ||
              (navLink && navLink.closest("#mobile-menu"))
            ) {
              mobileMenu.classList.add("hidden");
            }
          }
          if (modalCloseButton) {
            closeModal(modalCloseButton.closest(".modal-backdrop"));
            return;
          }
          if (modalBackdrop) {
            closeModal(modalBackdrop);
            return;
          }

          if (navLink) {
            e.preventDefault();
            const t = document.querySelector(navLink.getAttribute("href"));
            if (t) t.scrollIntoView({ behavior: "smooth" });
          } else if (staticModalTrigger) {
            openModal(
              document.getElementById(staticModalTrigger.dataset.modalTarget)
            );
          } else if (mapImageTrigger) {
            const s = mapImageTrigger.getAttribute("src"),
              mI = document.getElementById("modal-map-image"),
              mZ = document.getElementById("mapZoomModal");
            if (mI && mZ && s) {
              mI.setAttribute("src", s);
              openModal(mZ);
            }
          }

          // Trigger Modal Potensi
          else if (potensiModalTrigger) {
            e.preventDefault();
            const item = allPotensiItems.find(
              (i) => i.sys.id === potensiModalTrigger.dataset.potensiId
            );
            if (item) {
              let imageUrl =
                "https://via.placeholder.com/800x400.png?text=Icon";
              let imageAlt = item.fields.judul || "Ikon";
              if (item.fields.icon?.sys?.id) {
                const asset = allAssets.find(
                  (a) => a.sys.id === item.fields.icon.sys.id
                );
                if (asset?.fields?.file?.url) {
                  imageUrl = `https:${asset.fields.file.url}?w=800&h=400`; // Hapus fit=cover
                  imageAlt = asset.fields.title || item.fields.judul;
                }
              }
              let kontenHtml = "<p>Konten tidak tersedia.</p>";
              if (item.fields.isiLengkap) {
                kontenHtml =
                  "<p>" +
                  item.fields.isiLengkap
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/\n/g, "<br>") +
                  "</p>";
              }

              document.getElementById("modal-potensi-judul").textContent =
                item.fields.judul || "Potensi";
              const modalGambar = document.getElementById(
                "modal-potensi-gambar"
              );
              if (modalGambar) {
                modalGambar.src = imageUrl;
                modalGambar.alt = imageAlt;
                modalGambar.classList.add("bg-gray-200");
              }
              document.getElementById("modal-potensi-konten").innerHTML =
                kontenHtml;
              openModal(document.getElementById("potensiModal"));
            }
          } else if (beritaModalTrigger) {
            // Trigger Modal Berita
            e.preventDefault();
            const item = allBeritaItems.find(
              (i) => i.sys.id === beritaModalTrigger.dataset.beritaId
            );
            if (item) {
              let imgUrl = "https://via.placeholder.com/800x400.png?text=Foto";
              if (item.fields.gambar?.sys?.id) {
                const a = allAssets.find(
                  (a) => a.sys.id === item.fields.gambar.sys.id
                );
                if (a?.fields?.file?.url) {
                  imgUrl = `https:${a.fields.file.url}?w=800&h=400`;
                }
              } // Hapus fit=cover
              const tgl = item.fields.tanggal
                ? new Date(item.fields.tanggal).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "";
              let kont = "<p>Konten tidak tersedia.</p>";
              if (item.fields.isiLengkap) {
                kont =
                  "<p>" +
                  item.fields.isiLengkap
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/\n/g, "<br>") +
                  "</p>";
              }
              document.getElementById("modal-berita-judul").textContent =
                item.fields.judul || "Judul";
              document.getElementById("modal-berita-tanggal").textContent = tgl;
              const mG = document.getElementById("modal-berita-gambar");
              if (mG) {
                mG.src = imgUrl;
                mG.alt = item.fields.judul || "Gambar";
                mG.classList.add("bg-gray-200");
              }
              document.getElementById("modal-berita-konten").innerHTML = kont;
              openModal(document.getElementById("beritaModal"));
            }
          }
        });

        // Scroll Animation Logic
        const sections = document.querySelectorAll(".fade-in-section");
        const obs = new IntersectionObserver(
          (e) => {
            e.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1 }
        );
        sections.forEach((s) => {
          obs.observe(s);
        });

        // Number Counter Logic
        const counters = document.querySelectorAll(".data-counter");
        const ctrObs = new IntersectionObserver(
          (e, o) => {
            e.forEach((entry) => {
              if (entry.isIntersecting) {
                const t = +entry.target.getAttribute("data-target"),
                  d = 1500,
                  sT = 20,
                  inc = t / (d / sT);
                let curr = 0;
                const timer = setInterval(() => {
                  curr += inc;
                  if (curr >= t) {
                    entry.target.innerText = t.toLocaleString("id-ID");
                    clearInterval(timer);
                  } else {
                    entry.target.innerText =
                      Math.floor(curr).toLocaleString("id-ID");
                  }
                }, sT);
                o.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.5 }
        );
        counters.forEach((c) => {
          ctrObs.observe(c);
        });
      });