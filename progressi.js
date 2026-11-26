"use strict";

const livelliBiblioteca = biblioteca.flatMap((sezione) => sezione.livelli);
const totaleBiblioteca = livelliBiblioteca.reduce((totale, livello) => totale + livello.libri.length, 0);
const massimoStelle = livelliBiblioteca.length * 3;
const chiaviPrecedenti = ["biblioteca-biblica:v1", "biblioteca-biblica:v2"];
const chiaveProgressi = "biblioteca-biblica:v3";
let puliziaDaFare = true;
let salvataggioDisponibile = true;
let progressi = null;

function intero(valore) {
  return Number.isSafeInteger(valore) && valore >= 0 ? valore : 0;
}

function nomeSquadra(valore) {
  return typeof valore === "string" ? valore.trim().replace(/\s+/gu, " ").slice(0, 32).trim() : "";
}

function risultatoValido(dati) {
  if (!intero(dati?.verifiche)) return null;
  return { verifiche: dati.verifiche, durata: intero(dati.durata) };
}

function normalizzaPartita(dati) {
  const salvato = {
    attivo: livelliBiblioteca[0].id, sessioni: {}, verifiche: 0, durata: 0,
  };
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
    const corrispondono = posizioniCorrette(livello, posizioni);
    const esatto = corrispondono.filter(Boolean).length;
    const migliore = risultatoValido(stato.migliore);
    const verifiche = intero(stato.verifiche);
    const punteggio = stato.punteggio === esatto && collocati.length === codici.size &&
      (esatto < codici.size || migliore) ? esatto : null;
    salvato.sessioni[livello.id] = {
      ordine, posizioni, verifiche, punteggio, migliore, durata: intero(stato.durata),
      confermate: corrispondono.map((corretta, indice) =>
        corretta && (punteggio !== null || stato.confermate?.[indice] === true)),
    };
    salvato.verifiche += verifiche;
  }
  salvato.verifiche = Math.max(salvato.verifiche, intero(dati.verifiche));
  salvato.durata = intero(dati.durata);
  if (livelliBiblioteca.some((livello) => livello.id === dati.attivo)) salvato.attivo = dati.attivo;
  return salvato;
}

function leggiDati(chiave) {
  try {
    return JSON.parse(localStorage.getItem(chiave));
  } catch (errore) {
    if (!(errore instanceof SyntaxError)) salvataggioDisponibile = false;
    return null;
  }
}

const datiAttuali = leggiDati(chiaveProgressi);
const datiSquadre = datiAttuali ?? leggiDati(chiaviPrecedenti[1]);
const archivio = { attiva: null, squadre: [] };
if (Array.isArray(datiSquadre?.squadre)) {
  for (const dati of datiSquadre.squadre) {
    const nome = nomeSquadra(dati?.nome);
    if (!nome || typeof dati.id !== "string" || archivio.squadre.some((squadra) => squadra.id === dati.id)) continue;
    archivio.squadre.push({ ...normalizzaPartita(datiAttuali ? dati : null), id: dati.id, nome });
  }
  const attiva = archivio.squadre.find((squadra) => squadra.id === datiSquadre.attiva);
  if (attiva) archivio.attiva = attiva.id;
}

function creaSquadra(nome) {
  const squadra = { ...normalizzaPartita(null), id: Date.now().toString(36) + Math.random().toString(36).slice(2), nome };
  archivio.squadre.push(squadra);
  return squadra;
}

function salvaProgressi() {
  if (!salvataggioDisponibile) return false;
  try {
    localStorage.setItem(chiaveProgressi, JSON.stringify(archivio));
    if (puliziaDaFare) {
      for (const chiave of chiaviPrecedenti) localStorage.removeItem(chiave);
      puliziaDaFare = false;
    }
    return true;
  } catch {
    salvataggioDisponibile = false;
    return false;
  }
}

function posizioniCorrette(livello, posizioni) {
  return posizioni.map((codice, indice) => codice === livello.libri[indice].id);
}

function stellePer(verifiche) {
  return verifiche > 0 ? Math.max(1, 4 - verifiche) : 0;
}

function miglioreTra(prima, dopo) {
  return !prima || dopo.verifiche < prima.verifiche ? dopo : prima;
}

function risolto(livello) {
  const stato = progressi?.sessioni[livello.id];
  return Boolean(stato?.migliore);
}

function riepilogo() {
  const completati = livelliBiblioteca.filter(risolto);
  const risultati = completati.map((livello) => progressi.sessioni[livello.id].migliore);
  const verifiche = progressi?.verifiche ?? 0;
  const verificheMigliori = risultati.reduce((totale, risultato) => totale + risultato.verifiche, 0);
  return {
    libri: completati.reduce((totale, livello) => totale + livello.libri.length, 0),
    livelli: completati.length,
    sezioni: biblioteca.filter((sezione) => sezione.livelli.every(risolto)).length,
    stelle: risultati.reduce((totale, risultato) => totale + stellePer(risultato.verifiche), 0),
    verifiche,
    verificheMigliori,
    verificheAggiuntive: Math.max(0, verifiche - verificheMigliori),
    durata: progressi?.durata ?? 0,
  };
}
