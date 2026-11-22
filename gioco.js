"use strict";

const area = (id) => document.getElementById(id);
const gioco = area("game");
const titoloGioco = area("game-title");
const board = area("board");
const shelf = area("shelf");
const books = area("books");
const shelfTip = area("shelf-tip");
const feedback = area("feedback");
const annuncio = area("announcement");
const verifica = area("verify");
const continua = area("next");
const squadreDialog = area("teams-dialog");
const risultatoDialog = area("result-dialog");
const finaleDialog = area("finale-dialog");
const campoSquadra = area("team-input");
const mappa = area("library-details");
const formatoTelefono = matchMedia(
  "(max-width: 599px), (orientation: landscape) and (max-height: 500px) and (max-width: 980px)",
);
const telefonoVerticale = matchMedia("(max-width: 599px) and (orientation: portrait)");
let livello;
let sezione;
let sessione;
let selezione = null;
let orologioDa = null;

function elemento(tag, classe, testo) {
  const nodo = document.createElement(tag);
  if (classe) nodo.className = classe;
  if (testo !== undefined) nodo.textContent = testo;
  return nodo;
}

function bottone(classe, testo) {
  const nodo = elemento("button", classe, testo);
  nodo.type = "button";
  return nodo;
}

function mescola(libri, precedente) {
  const canonico = libri.map((libro) => libro.id);
  let ordine;
  do {
    ordine = [...canonico];
    for (let indice = ordine.length - 1; indice > 0; indice--) {
      const altro = Math.floor(Math.random() * (indice + 1));
      [ordine[indice], ordine[altro]] = [ordine[altro], ordine[indice]];
    }
  } while ([canonico, precedente].some((sequenza) =>
    sequenza && ordine.every((codice, indice) => codice === sequenza[indice])));
  return ordine;
}

function nuovaSessione(scelta, precedente) {
  return {
    ordine: mescola(scelta.libri, precedente?.ordine),
    posizioni: Array(scelta.libri.length).fill(null),
    punteggio: null,
    verifiche: 0,
    durata: 0,
    storico: precedente?.storico === true,
    migliore: precedente?.migliore ?? null,
  };
}

function disponibile(scelta, raccolta) {
  return raccolta.livelli.slice(0, scelta.numero - 1).every(risolto);
}

function libriSistemati(scelta) {
  return scelta.livelli.reduce((totale, gruppo) => totale + (risolto(gruppo) ? gruppo.libri.length : 0), 0);
}

function registra() {
  area("storage-note").hidden = salvaProgressi();
}

function portaInVista(nodo) {
  if (!nodo || !telefonoVerticale.matches) return;
  const ret = nodo.getBoundingClientRect();
  const altezza = window.visualViewport?.height ?? window.innerHeight;
  if (ret.top < 0 || ret.bottom > altezza) nodo.scrollIntoView({ block: "nearest" });
}

function apriLivello(scelta, daInterazione = false) {
  const raccolta = biblioteca.find((voce) => voce.id === scelta.sezione);
  if (!disponibile(scelta, raccolta)) return;
  fermaOrologio();
  livello = scelta;
  sezione = raccolta;
  sessione = progressi.sessioni[scelta.id] ?? nuovaSessione(scelta);
  progressi.sessioni[scelta.id] = sessione;
  progressi.attivo = scelta.id;
  selezione = null;

  gioco.dataset.section = sezione.id;
  board.style.setProperty("--columns", scelta.libri.length);
  board.classList.toggle("dense", scelta.libri.length >= 7);
  area("section-label").textContent = `${sezione.testamento} / ${sezione.titolo}`;
  mostraNavigazione();
  mostraGioco();
  registra();
  avviaOrologio();

  if (daInterazione) {
    if (formatoTelefono.matches) mappa.open = false;
    titoloGioco.focus({ preventScroll: true });
    if (titoloGioco.getBoundingClientRect().top < 0 || formatoTelefono.matches) {
      titoloGioco.scrollIntoView({ block: "nearest" });
    }
    annuncio.textContent = `${sezione.titolo}, livello ${livello.numero}.`;
  }
}

function vistaSezione(raccolta) {
  return raccolta.livelli.find((gruppo) => !risolto(gruppo)) ?? raccolta.livelli[0];
}

function prossimaTappa() {
  const successivo = sezione.livelli.slice(livello.numero).find((gruppo) => !risolto(gruppo));
  if (successivo) return successivo;
  const indice = biblioteca.indexOf(sezione);
  const altre = [...biblioteca.slice(indice + 1), ...biblioteca.slice(0, indice)];
  const incompleta = altre.find((voce) => !voce.livelli.every(risolto));
  return incompleta ? vistaSezione(incompleta) : null;
}

function intervallo(gruppo) {
  return `${gruppo.libri[0].numero}–${gruppo.libri[gruppo.libri.length - 1].numero}`;
}

function mostraMappa() {
  const dati = riepilogo();
  const sistemati = dati.libri;
  mostraStatistiche(area("library-stats"), [
    ["Livelli", `${dati.livelli} / ${livelliBiblioteca.length}`],
    ["Sezioni", `${dati.sezioni} / ${biblioteca.length}`],
    ["Stelle", `${dati.stelle} / ${massimoStelle}`],
    ["Verifiche", dati.verifiche],
  ]);
  area("show-finale").hidden = dati.livelli !== livelliBiblioteca.length;
  area("legacy-note").hidden = !Object.values(progressi.sessioni).some((stato) => stato.storico);
  area("library-count").textContent = `${sistemati} / ${totaleBiblioteca} sistemati`;
  area("library-remaining").textContent = `${totaleBiblioteca - sistemati} da sistemare`;
  area("library-meter-fill").style.width = `${sistemati / totaleBiblioteca * 100}%`;

  const elenco = area("library-sections");
  elenco.replaceChildren();
  for (const testamento of [antico, nuovo]) {
    const parte = elemento("div", "testament-group");
    const sezioni = elemento("ul", "sections");
    parte.append(elemento("h2", "testament", testamento), sezioni);
    for (const raccolta of biblioteca.filter((voce) => voce.testamento === testamento)) {
      const quanti = libriSistemati(raccolta);
      const aperta = raccolta === sezione;
      const completa = quanti === raccolta.totale;
      const bottoneSezione = bottone("section-row");
      bottoneSezione.dataset.section = raccolta.id;
      bottoneSezione.setAttribute("aria-label",
        `${raccolta.titolo}, ${quanti} di ${raccolta.totale} libri sistemati${completa ? ", sezione completata" : ""}`);
      if (aperta) bottoneSezione.setAttribute("aria-current", "true");
      const colore = elemento("span", "section-icon");
      colore.setAttribute("aria-hidden", "true");
      const conta = elemento("span", "section-count", completa ? `✓ ${quanti}/${raccolta.totale}` : `${quanti}/${raccolta.totale}`);
      const scaffali = elemento("span", "mini-shelves");
      scaffali.setAttribute("aria-hidden", "true");
      for (const gruppo of raccolta.livelli) {
        const pieno = risolto(gruppo);
        const ripiano = elemento("span", pieno ? "mini-shelf filled" : "mini-shelf");
        for (const libro of gruppo.libri) {
          const dorso = elemento("span", "mini-book");
          if (pieno) dorso.title = libro.titolo;
          ripiano.append(dorso);
        }
        scaffali.append(ripiano);
      }
      bottoneSezione.append(colore, elemento("span", "section-name", raccolta.titolo), conta, scaffali);
      bottoneSezione.addEventListener("click", () => apriLivello(aperta ? livello : vistaSezione(raccolta), true));
      const riga = elemento("li");
      riga.append(bottoneSezione);
      sezioni.append(riga);
    }
    elenco.append(parte);
  }
}

function mostraLivelli() {
  const mostra = sezione.livelli.length > 1;
  area("level-nav").hidden = !mostra;
  if (!mostra) return;
  const nav = area("level-buttons");
  nav.replaceChildren(...sezione.livelli.map((gruppo) => {
    const fatto = risolto(gruppo);
    const etichetta = `Livello ${gruppo.numero}`;
    const voce = bottone("level-button", fatto ? `${etichetta} ✓` : etichetta);
    voce.disabled = !disponibile(gruppo, sezione);
    if (gruppo === livello) voce.setAttribute("aria-current", "step");
    voce.setAttribute("aria-label",
      `${etichetta}, libri ${intervallo(gruppo)}${fatto ? ", completato" : voce.disabled ? ", da sbloccare" : ""}`);
    voce.addEventListener("click", () => apriLivello(gruppo, true));
    return voce;
  }));
  area("level-note").textContent = sezione.livelli.every(risolto)
    ? "Sezione completata."
    : livello.numero === sezione.livelli.length ? "Completa questo livello per finire la sezione."
      : "Completa un livello per aprire il successivo.";
}

function mostraIndice() {
  const sistemati = libriSistemati(sezione);
  area("catalog-count").textContent = `${sistemati} / ${sezione.totale} sistemati`;
  area("catalog-list").replaceChildren(...sezione.livelli.map((gruppo) => {
    const sezioneIndice = elemento("div", "catalog-group");
    const titolo = sezione.livelli.length > 1 ? `Livello ${gruppo.numero} · ` : "";
    const fatto = risolto(gruppo);
    sezioneIndice.append(elemento("h3", "", `${titolo}Libri ${intervallo(gruppo)}`));
    if (fatto) {
      const libri = elemento("ol", "catalog-books");
      libri.start = gruppo.libri[0].numero;
      libri.append(...gruppo.libri.map((libro) => elemento("li", "", libro.titolo)));
      sezioneIndice.append(libri);
      const migliore = progressi.sessioni[gruppo.id].migliore;
      if (migliore) sezioneIndice.append(elemento("p", "catalog-rating",
        `${stellePer(migliore.verifiche)} / 3 stelle · ${testoVerifiche(migliore.verifiche)} · ${formattaTempo(migliore.durata)}`));
    } else {
      sezioneIndice.append(elemento("p", "", `${gruppo.libri.length} libri da sistemare`));
    }
    return sezioneIndice;
  }));
}

function mostraNavigazione() {
  mostraMappa();
  mostraLivelli();
  mostraIndice();
}

function dorso(libro) {
  const copertina = elemento("span", "cover");
  const valore = [...libro.id].reduce((somma, lettera) => somma + lettera.charCodeAt(0), 0);
  copertina.dataset.mark = valore % 4;
  const decorazione = elemento("span", "cover-mark");
  decorazione.setAttribute("aria-hidden", "true");
  const titolo = elemento("span", "book-title");
  if (libro.sillabe) {
    const [prima, dopo] = libro.sillabe.split("|");
    titolo.append(prima, document.createElement("wbr"), dopo);
  } else {
    titolo.textContent = libro.titolo;
  }
  copertina.append(decorazione, titolo);
  return copertina;
}

function mostraScaffale() {
  shelf.replaceChildren(...sessione.posizioni.map((codice, indice) => {
    const numero = livello.libri[indice].numero;
    const libro = livello.libri.find((voce) => voce.id === codice);
    const slot = bottone("slot");
    slot.setAttribute("aria-label", `Posizione ${numero}, ${libro?.titolo ?? "vuota"}`);
    slot.disabled = concluso();
    if (libro) {
      slot.classList.add("occupied");
      slot.setAttribute("aria-pressed", String(codice === selezione));
    }
    if (selezione && codice !== selezione) slot.classList.add("destination");
    slot.append(elemento("span", "slot-number", numero), libro ? dorso(libro) : elemento("span", "slot-empty", "+"));
    slot.addEventListener("click", (evento) => {
      toccaPosizione(indice, evento.detail === 0);
    });
    return slot;
  }));
}

function mostraLibriDisponibili() {
  const disponibili = sessione.ordine.filter((codice) => !sessione.posizioni.includes(codice));
  const numero = area("available-count");
  numero.textContent = disponibili.length;
  numero.setAttribute("aria-label", `${disponibili.length} libri disponibili`);
  books.replaceChildren(...disponibili.map((codice) => {
    const libro = livello.libri.find((voce) => voce.id === codice);
    const voce = bottone("book");
    voce.setAttribute("aria-label", libro.titolo);
    voce.setAttribute("aria-pressed", String(codice === selezione));
    voce.append(dorso(libro));
    voce.addEventListener("click", (evento) => {
      selezione = selezione === codice ? null : codice;
      mostraGioco();
      annuncio.textContent = selezione ? shelfTip.textContent : "Selezione annullata.";
      if (evento.detail === 0) {
        if (selezione) shelf.children[sessione.posizioni.indexOf(null)].focus();
        else books.children[disponibili.indexOf(codice)].focus();
      } else if (selezione) {
        portaInVista(shelf);
      }
    });
    return voce;
  }));
  if (disponibili.length === 0) {
    books.append(elemento("p", "tray-empty", "Tutti i libri sono sullo scaffale."));
  }
}

function concluso() {
  return Boolean(sessione && livello && sessione.punteggio === livello.libri.length);
}

function mostraGioco() {
  const totale = livello.libri.length;
  const collocati = sessione.posizioni.filter(Boolean).length;
  mostraScaffale();
  mostraLibriDisponibili();
  area("placed-count").textContent = `${collocati} / ${totale} collocati`;
  area("progress-dots").replaceChildren(...livello.libri.map((_, indice) =>
    elemento("span", indice < collocati ? "filled" : "")));
  const selezionato = livello.libri.find((libro) => libro.id === selezione);
  shelfTip.textContent = concluso() ? "Sequenza completata." : selezionato
    ? `${selezionato.titolo} selezionato. Tocca una posizione.`
    : "Per scambiare due libri, toccali uno dopo l’altro sullo scaffale.";
  board.classList.toggle("placing", Boolean(selezione));
  verifica.disabled = collocati !== totale || sessione.punteggio !== null;
  area("reset").hidden = concluso();
  area("view-result").hidden = !concluso();
  aggiornaOrologio();

  if (sessione.punteggio === null) {
    feedback.removeAttribute("data-result");
    feedback.textContent = collocati === totale
      ? "Lo scaffale è pieno. Ora puoi verificare l’ordine."
      : "Colloca tutti i libri per verificare l’ordine.";
    return;
  }
  const corretti = sessione.punteggio;
  feedback.dataset.result = concluso() ? "right" : "retry";
  feedback.replaceChildren(
    elemento("strong", "", `${corretti} ${corretti === 1 ? "libro" : "libri"} su ${totale} in posizione corretta`),
    elemento("span", "", concluso() ? "Avete completato lo scaffale." :
      "Discutete e riprovate!"),
  );
}

function toccaPosizione(indice, daTastiera) {
  const codice = sessione.posizioni[indice];
  if (!selezione || selezione === codice) {
    selezione = selezione === codice ? null : codice;
    mostraGioco();
    annuncio.textContent = codice ? (selezione ? shelfTip.textContent : "Selezione annullata.")
      : "Tocca un libro disponibile, poi scegli una posizione.";
    if (daTastiera) shelf.children[indice].focus();
    return;
  }

  const origine = sessione.posizioni.indexOf(selezione);
  const libro = livello.libri.find((voce) => voce.id === selezione);
  const sostituito = livello.libri.find((voce) => voce.id === codice);
  sessione.posizioni[indice] = selezione;
  if (origine !== -1) sessione.posizioni[origine] = codice;
  selezione = null;
  sessione.punteggio = null;
  mostraGioco();
  registra();

  const numero = livello.libri[indice].numero;
  const ritorno = sostituito ? (origine === -1
    ? ` ${sostituito.titolo} torna tra i libri disponibili.`
    : ` ${sostituito.titolo} in posizione ${livello.libri[origine].numero}.`) : "";
  annuncio.textContent = `${libro.titolo} in posizione ${numero}.${ritorno}`;
  if (daTastiera) shelf.children[indice].focus();
  else if (origine === -1) portaInVista(books.querySelector(".book") ?? verifica);
}

verifica.addEventListener("click", () => {
  if (verifica.disabled) return;
  selezione = null;
  sessione.verifiche++;
  progressi.verifiche++;
  const corretti = contaCorretti(livello, sessione.posizioni);
  if (corretti === livello.libri.length) {
    fermaOrologio();
    const risultato = { verifiche: sessione.verifiche, durata: sessione.durata };
    sessione.migliore = miglioreTra(sessione.migliore, risultato);
  }
  sessione.punteggio = corretti;
  mostraNavigazione();
  mostraGioco();
  registra();
  if (concluso()) mostraRisultato();
});

area("reset").addEventListener("click", () => {
  if (concluso()) return;
  sessione.ordine = mescola(livello.libri, sessione.ordine);
  sessione.posizioni.fill(null);
  sessione.punteggio = null;
  selezione = null;
  mostraGioco();
  registra();
  annuncio.textContent = "Scaffale svuotato. Verifiche e tempo conservati.";
  portaInVista(shelf);
});

area("view-result").addEventListener("click", mostraRisultato);
area("replay").addEventListener("click", () => {
  progressi.sessioni[livello.id] = nuovaSessione(livello, sessione);
  risultatoDialog.close();
  apriLivello(livello, true);
});

continua.addEventListener("click", () => {
  const tappa = prossimaTappa();
  risultatoDialog.close();
  if (tappa) apriLivello(tappa, true);
  else mostraFinale();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape" || !selezione) return;
  const codice = selezione;
  const posizione = sessione.posizioni.indexOf(codice);
  selezione = null;
  mostraGioco();
  if (posizione !== -1) shelf.children[posizione].focus();
  else {
    const disponibili = sessione.ordine.filter((voce) => !sessione.posizioni.includes(voce));
    books.children[disponibili.indexOf(codice)].focus();
  }
  annuncio.textContent = "Selezione annullata.";
});

function osservaFormato(formato, aggiorna) {
  aggiorna();
  if (formato.addEventListener) formato.addEventListener("change", aggiorna);
  else formato.addListener(aggiorna);
}

osservaFormato(formatoTelefono, () => { mappa.open = !formatoTelefono.matches; });
osservaFormato(telefonoVerticale, () => {
  board.prepend(area(telefonoVerticale.matches ? "tray" : "shelf-panel"));
});

function formattaTempo(durata) {
  const secondi = Math.floor(durata / 1000);
  const ore = Math.floor(secondi / 3600);
  const minuti = Math.floor(secondi / 60) % 60;
  const due = (numero) => String(numero).padStart(2, "0");
  return ore ? `${ore}:${due(minuti)}:${due(secondi % 60)}` : `${minuti}:${due(secondi % 60)}`;
}

function aggiornaOrologio() {
  const trascorso = orologioDa === null ? 0 : Math.floor(performance.now() - orologioDa);
  const tempo = formattaTempo((sessione?.durata ?? 0) + trascorso);
  if (area("level-clock").textContent !== tempo) area("level-clock").textContent = tempo;
}

function avviaOrologio() {
  if (orologioDa === null && sessione && !concluso() && !document.hidden &&
      !document.querySelector("dialog[open]")) orologioDa = performance.now();
  aggiornaOrologio();
}

function accumulaTempo() {
  if (orologioDa === null) return;
  const adesso = performance.now();
  const trascorso = Math.floor(adesso - orologioDa);
  sessione.durata += trascorso;
  progressi.durata += trascorso;
  orologioDa += trascorso;
}

function fermaOrologio() {
  accumulaTempo();
  orologioDa = null;
}

function sospendiPartita() {
  fermaOrologio();
  aggiornaOrologio();
  if (progressi) registra();
}

setInterval(aggiornaOrologio, 250);
setInterval(() => {
  if (orologioDa === null) return;
  accumulaTempo();
  registra();
}, 5000);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) sospendiPartita();
  else avviaOrologio();
});
window.addEventListener("pagehide", sospendiPartita);
window.addEventListener("pageshow", avviaOrologio);

function apriDialog(dialogo, fuoco) {
  sospendiPartita();
  if (!dialogo.open) dialogo.showModal();
  fuoco.focus({ preventScroll: true });
  dialogo.scrollTop = 0;
}

for (const dialogo of [squadreDialog, risultatoDialog, finaleDialog]) {
  dialogo.addEventListener("close", avviaOrologio);
}

function testoVerifiche(numero) {
  return `${numero} ${numero === 1 ? "verifica" : "verifiche"}`;
}

function mostraStatistiche(destinazione, voci) {
  destinazione.replaceChildren(...voci.map(([etichetta, valore]) => {
    const scheda = elemento("div");
    scheda.append(elemento("dt", "", etichetta), elemento("dd", "", valore));
    return scheda;
  }));
}

function mostraRisultato() {
  if (!concluso()) return;
  const attuale = sessione.verifiche;
  const stelle = stellePer(attuale);
  area("result-team").textContent = progressi.nome;
  area("result-level").textContent = `${sezione.titolo} · Livello ${livello.numero} · Libri ${intervallo(livello)}`;
  const valutazione = area("result-stars");
  valutazione.hidden = attuale === 0;
  valutazione.replaceChildren();
  if (attuale) {
    const simboli = elemento("span", "rating-marks", "★".repeat(stelle) + "☆".repeat(3 - stelle));
    simboli.setAttribute("aria-hidden", "true");
    valutazione.append(simboli, elemento("span", "rating-label", `${stelle} / 3 stelle`));
  }
  mostraStatistiche(area("result-stats"), [
    ["Libri in ordine", livello.libri.length],
    ["Verifiche", attuale || "—"],
    ["Tempo", attuale ? formattaTempo(sessione.durata) : "—"],
  ]);
  const nota = area("result-best");
  const migliore = sessione.migliore;
  nota.hidden = attuale > 0 && migliore?.verifiche === attuale;
  nota.textContent = attuale === 0
    ? "Completato nella versione precedente. Rigiocate per registrare stelle, verifiche e tempo."
    : `Risultato ufficiale · ${stellePer(migliore.verifiche)} / 3 stelle · ${testoVerifiche(migliore.verifiche)} · ${formattaTempo(migliore.durata)}`;
  const sequenza = area("result-books");
  sequenza.start = livello.libri[0].numero;
  sequenza.replaceChildren(...livello.libri.map((libro) => elemento("li", "", libro.titolo)));
  const tappa = prossimaTappa();
  continua.textContent = tappa ? (tappa.sezione === sezione.id ? "Livello successivo" : "Prossima sezione") : "Vedi il finale";
  apriDialog(risultatoDialog, area("result-title"));
}

function mostraFinale() {
  const dati = riepilogo();
  if (dati.livelli !== livelliBiblioteca.length) return;
  area("finale-team").textContent = progressi.nome;
  const insieme = area("finale-library");
  insieme.replaceChildren(...biblioteca.map((raccolta, indice) => {
    const riga = elemento("div", "finale-shelf");
    riga.dataset.section = raccolta.id;
    riga.style.setProperty("--shelf-index", indice);
    const dorsi = elemento("div", "finale-spines");
    dorsi.setAttribute("aria-hidden", "true");
    for (const gruppo of raccolta.livelli) {
      for (const libro of gruppo.libri) {
        const dorso = elemento("span", "finale-spine");
        dorso.title = libro.titolo;
        dorsi.append(dorso);
      }
    }
    riga.append(elemento("strong", "", raccolta.titolo), dorsi);
    return riga;
  }));
  mostraStatistiche(area("finale-stats"), [
    ["Libri", `${dati.libri} / ${totaleBiblioteca}`],
    ["Livelli", `${dati.livelli} / ${livelliBiblioteca.length}`],
    ["Stelle", `${dati.stelle} / ${massimoStelle}`],
    ["Verifiche dei migliori risultati", dati.verificheMigliori],
    ["Verifiche aggiuntive", dati.verificheAggiuntive],
    ["Tempo di gioco", formattaTempo(dati.durata)],
  ]);
  area("finale-legacy-note").hidden = dati.completatiSenzaRisultato === 0;
  apriDialog(finaleDialog, area("finale-title"));
}

function usaSquadra(squadra) {
  fermaOrologio();
  progressi = squadra;
  archivio.attiva = squadra.id;
  area("team-name").textContent = squadra.nome;
  area("layout").hidden = false;
  if (squadreDialog.open) squadreDialog.close();
  const scelta = livelliBiblioteca.find((gruppo) => gruppo.id === squadra.attivo);
  const raccolta = biblioteca.find((voce) => voce.id === scelta.sezione);
  apriLivello(disponibile(scelta, raccolta) ? scelta : vistaSezione(raccolta), true);
}

function mostraSquadre() {
  campoSquadra.value = "";
  campoSquadra.setCustomValidity("");
  area("saved-teams").hidden = !archivio.squadre.length;
  area("close-teams").hidden = !progressi;
  area("import-choice").hidden = !puoImportare();
  area("import-progress").checked = true;
  area("saved-team-buttons").replaceChildren(...archivio.squadre.map((squadra) => {
    const voce = bottone("action-secondary", squadra.nome);
    if (squadra === progressi) voce.setAttribute("aria-current", "true");
    voce.addEventListener("click", () => usaSquadra(squadra));
    return voce;
  }));
  apriDialog(squadreDialog, area("teams-title"));
}

area("team-form").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nome = nomeSquadra(campoSquadra.value);
  const presente = archivio.squadre.some((squadra) => squadra.nome.localeCompare(nome, "it", { sensitivity: "base" }) === 0);
  if (!nome || presente) {
    campoSquadra.setCustomValidity(nome ? "Questo nome è già in uso. Sceglietene un altro o aprite la partita salvata." :
      "Scrivete un nome per la squadra.");
    campoSquadra.reportValidity();
    return;
  }
  usaSquadra(creaSquadra(nome, area("import-progress").checked));
});

campoSquadra.addEventListener("input", () => campoSquadra.setCustomValidity(""));
squadreDialog.addEventListener("cancel", (evento) => {
  if (!progressi) evento.preventDefault();
});
area("close-teams").addEventListener("click", () => squadreDialog.close());
area("team-control").addEventListener("click", mostraSquadre);
area("show-finale").addEventListener("click", mostraFinale);
area("new-team").addEventListener("click", () => {
  finaleDialog.close();
  mostraSquadre();
});
area("review-library").addEventListener("click", () => {
  finaleDialog.close();
  mappa.open = true;
  const titoloMappa = mappa.querySelector("summary");
  titoloMappa.focus({ preventScroll: true });
  titoloMappa.scrollIntoView({ block: "nearest" });
});

const squadraSalvata = archivio.squadre.find((squadra) => squadra.id === archivio.attiva);
if (squadraSalvata) usaSquadra(squadraSalvata);
else mostraSquadre();
