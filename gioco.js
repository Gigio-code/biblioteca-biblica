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
const mappa = area("library-details");
const formatoTelefono = matchMedia(
  "(max-width: 599px), (orientation: landscape) and (max-height: 500px) and (max-width: 980px)",
);
const telefonoVerticale = matchMedia("(max-width: 599px) and (orientation: portrait)");
let livello;
let sezione;
let sessione;
let selezione = null;

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
    verificato: false,
    risolto: precedente?.risolto === true,
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
  const sistemati = biblioteca.reduce((totale, raccolta) => totale + libriSistemati(raccolta), 0);
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

function mostraScaffale(esito) {
  shelf.replaceChildren(...sessione.posizioni.map((codice, indice) => {
    const numero = livello.libri[indice].numero;
    const libro = livello.libri.find((voce) => voce.id === codice);
    const slot = bottone("slot");
    const corretta = esito?.[indice];
    const legenda = esito ? (corretta ? ", posizione corretta" : ", posizione da rivedere") : "";
    slot.setAttribute("aria-label", `Posizione ${numero}, ${libro?.titolo ?? "vuota"}${legenda}`);
    if (libro) {
      slot.classList.add("occupied");
      slot.setAttribute("aria-pressed", String(codice === selezione));
    }
    if (selezione && codice !== selezione) slot.classList.add("destination");
    slot.append(elemento("span", "slot-number", numero), libro ? dorso(libro) : elemento("span", "slot-empty", "+"));
    if (esito) {
      slot.dataset.result = corretta ? "right" : "retry";
      slot.append(elemento("span", "slot-result", corretta ? "✓" : "×"));
    }
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

function mostraGioco() {
  const totale = livello.libri.length;
  const collocati = sessione.posizioni.filter(Boolean).length;
  const esito = sessione.verificato
    ? sessione.posizioni.map((codice, indice) => codice === livello.libri[indice].id) : null;
  mostraScaffale(esito);
  mostraLibriDisponibili();
  area("placed-count").textContent = `${collocati} / ${totale} collocati`;
  area("progress-dots").replaceChildren(...livello.libri.map((_, indice) =>
    elemento("span", indice < collocati ? "filled" : "")));
  const selezionato = livello.libri.find((libro) => libro.id === selezione);
  shelfTip.textContent = selezionato
    ? `${selezionato.titolo} selezionato. Tocca una posizione.`
    : "Per scambiare due libri, toccali uno dopo l’altro sullo scaffale.";
  board.classList.toggle("placing", Boolean(selezione));
  verifica.disabled = collocati !== totale;
  continua.hidden = true;

  if (!esito) {
    feedback.removeAttribute("data-result");
    feedback.textContent = collocati === totale
      ? "Lo scaffale è pieno. Ora puoi verificare l’ordine."
      : "Colloca tutti i libri per verificare l’ordine.";
    return;
  }

  const corretti = esito.filter(Boolean).length;
  const vittoria = corretti === totale;
  let messaggio = "Sposta i libri da rivedere, poi verifica di nuovo.";
  if (vittoria) {
    const tappa = prossimaTappa();
    messaggio = !tappa ? `Biblioteca completata. Hai sistemato tutti i ${totaleBiblioteca} libri!`
      : sezione.livelli.every(risolto) ? "Hai completato la sezione!" : "Hai completato lo scaffale!";
    if (tappa) {
      continua.textContent = tappa.sezione === sezione.id ? `Vai al livello ${tappa.numero}` : "Prossima sezione";
      continua.hidden = false;
    }
  }
  feedback.dataset.result = vittoria ? "right" : "retry";
  feedback.replaceChildren(
    elemento("strong", "", `${corretti} su ${totale} in posizione corretta`),
    elemento("span", "", messaggio),
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
  sessione.verificato = false;
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
  if (sessione.posizioni.some((codice) => !codice)) return;
  selezione = null;
  sessione.verificato = true;
  if (!sessione.risolto && sessione.posizioni.every((codice, indice) => codice === livello.libri[indice].id)) {
    sessione.risolto = true;
    mostraNavigazione();
  }
  mostraGioco();
  registra();
});

area("reset").addEventListener("click", () => {
  sessione = nuovaSessione(livello, sessione);
  progressi.sessioni[livello.id] = sessione;
  selezione = null;
  mostraGioco();
  registra();
  annuncio.textContent = "Scaffale svuotato. Libri mescolati.";
  portaInVista(shelf);
});

continua.addEventListener("click", () => {
  const tappa = prossimaTappa();
  if (tappa) apriLivello(tappa, true);
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

const sceltaSalvata = livelliBiblioteca.find((gruppo) => gruppo.id === progressi.attivo);
const sezioneSalvata = biblioteca.find((voce) => voce.id === sceltaSalvata.sezione);
apriLivello(disponibile(sceltaSalvata, sezioneSalvata) ? sceltaSalvata : vistaSezione(sezioneSalvata));
