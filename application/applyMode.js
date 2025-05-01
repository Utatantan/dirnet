document.addEventListener('DOMContentLoaded', () => {
    applyMode(localStorage.getItem("mode") || detectSystemPreference());
});
function applyMode(mode) {
    if (mode === "dark") {
        document.body.classList.add("dark-mode");
        document.querySelectorAll('input').forEach(input => input.classList.add('dark-mode'));
        document.querySelectorAll('button').forEach(button => button.classList.add('dark-mode'));          
    } else {
        document.body.classList.remove("dark-mode");
        document.querySelectorAll('input').forEach(input => input.classList.remove('dark-mode'));
        document.querySelectorAll('button').forEach(button => button.classList.remove('dark-mode'));        
    }
}