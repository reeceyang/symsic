document.addEventListener("DOMContentLoaded", (event) => {
  verovio.module.onRuntimeInitialized = async () => {
    window.verovioToolkit = new verovio.toolkit();
    console.log("Verovio has loaded!");
    window.verovioToolkit.setOptions({
      scale: 50,
    });
  }
});