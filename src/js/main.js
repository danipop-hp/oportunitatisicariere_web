document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-eroare');

    if(asd) {
        btn.addEventListener('click', () => {
            throw new Error("Aceasta este o eroare de test din proiectul meu HTML!");
        });
    }
});