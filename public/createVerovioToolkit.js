document.addEventListener("DOMContentLoaded", (event) => {
  verovio.module.onRuntimeInitialized = async _ => {
    window.tk = new verovio.toolkit();
    console.log("Verovio has loaded!");
  }
});