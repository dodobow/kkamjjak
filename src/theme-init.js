(() => {
  const localThemeKey = "dopamineButtonTheme";
  let theme = "light";

  try {
    if (localStorage.getItem(localThemeKey) === "dark") {
      theme = "dark";
    }
  } catch (error) {
    console.warn("theme mirror read failed", error);
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
