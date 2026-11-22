"use strict";

const livelliBiblioteca = biblioteca.flatMap((sezione) => sezione.livelli);
const totaleBiblioteca = livelliBiblioteca.reduce((totale, livello) => totale + livello.libri.length, 0);
const chiaveProgressi = "biblioteca-biblica:v1";
let salvataggioDisponibile = true;

function leggiProgressi() {
  const salvato = { attivo: livelliBiblioteca[0].id, sessioni: {} };
  try {
    const dati = JSON.parse(localStorage.getItem(chiaveProgressi));
    if (!dati || typeof dati !== "object") return salvato;
    for (const livello of livelliBiblioteca) {
      const stato = dati.sessioni?.[livello.id];
      if (!stato || typeof stato !== "object") continue;
      const codici = new Set(livello.libri.map((libro) => libro.id));
      const { ordine, posizioni } = stato;
      if (!Array.isArray(ordine) || ordine.length !== codici.size ||
          new Set(ordine).size !== codici.size || !ordine.every((codice) => codici.has(codice))) continue;
      if (!Array.isArray(posizioni) || posizioni.length !== codici.size ||
          !posizioni.every((codice) => codice === null || codici.has(codice))) continue;
      const collocati = posizioni.filter(Boolean);
      if (new Set(collocati).size !== collocati.length) continue;
      salvato.sessioni[livello.id] = {
        ordine, posizioni,
        verificato: stato.verificato === true && collocati.length === codici.size,
        risolto: stato.risolto === true,
      };
    }
    if (livelliBiblioteca.some((livello) => livello.id === dati.attivo)) salvato.attivo = dati.attivo;
  } catch (errore) {
    if (!(errore instanceof SyntaxError)) salvataggioDisponibile = false;
  }
  return salvato;
}

const progressi = leggiProgressi();

function salvaProgressi() {
  if (!salvataggioDisponibile) return false;
  try {
    localStorage.setItem(chiaveProgressi, JSON.stringify(progressi));
    return true;
  } catch {
    salvataggioDisponibile = false;
    return false;
  }
}

function risolto(livello) {
  return progressi.sessioni[livello.id]?.risolto === true;
}
